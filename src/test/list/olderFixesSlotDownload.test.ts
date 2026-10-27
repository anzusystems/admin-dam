import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * "Download" in the row menu of the Slots tab opens a tab at
 * the press, then asks the server for the signed file address.
 * Pressed again while the address was pending, it opened a second tab and asked again.
 * A browser that gave no tab (popup blocker) left the editor with nothing and no message.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DOWNLOAD_LINK = /^\/adm\/v1\/image\/([^/]+)\/download-link$/

const NO_TAB = 'The browser did not open a new tab. Allow pop-up windows for this site and try again.'
const SIGNED = 'https://storage.test/file-3?signature=1'

const LIST = '/assets'
const IMAGE = 'asset-1'

const fileOnServer = (fileId: string) => ({
  ...assetFile(fileId, 'processed', { asset: IMAGE }),
  _resourceName: 'imageFile',
  imageAttributes: { width: 800, height: 450, ratioWidth: 16, ratioHeight: 9, mostDominantColor: '#cccccc' },
})

const onServer = () => ({
  ...assetDetail(IMAGE, {
    attributes: { assetType: 'image', assetStatus: 'with_file' },
    mainFile: fileOnServer('file-3'),
  }),
  keywords: [],
  authors: [],
})

const settled = () => vi.advanceTimersByTimeAsync(100)

const newTab = () => {
  const sentTo: Array<{ address: string; reachesOpener: boolean }> = []
  const address = 'about:blank'
  const tab = {
    opener: window as unknown,
    closed: false,
    close: () => {
      tab.closed = true
    },
    location: {
      get href() {
        return address
      },
      replace: (to: string) => void sentTo.push({ address: to, reachesOpener: tab.opener !== null }),
    },
    sentTo,
  }

  return tab
}

type Tab = ReturnType<typeof newTab>

const browserOpensTabs = (gives = true) => {
  const given: Tab[] = []
  const open = vi.fn<(...asked: unknown[]) => Tab | null>(() => {
    if (!gives) return null
    given.push(newTab())

    return given.at(-1)!
  })
  vi.stubGlobal('open', open)

  return { asked: () => open.mock.calls, given }
}

const holdLink = () => {
  let answer: () => void = () => undefined
  server.on(
    'GET',
    DOWNLOAD_LINK,
    () => new Promise<FakeDamAnswer>((resolve) => (answer = () => resolve({ status: 200, data: { link: SIGNED } })))
  )

  return async () => {
    answer()
    await settled()
  }
}

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

const openDownload = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    extSystem: { image: { slots: ['default'] } },
    customForm: { image: [customField('title')] },
  })
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
  } as never)
  // The one request of the page that does not go through the client: the version the application is served in.
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tile = await eventually(() => {
    const found = page.querySelector<HTMLElement>('.dam-image-grid__item')
    expect(found).not.toBeNull()

    return found!
  })
  tile.querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  await eventually(() => expect(detail()?.querySelector('[data-cy="button-slots"]')).toBeTruthy())
  const slotsTab = () => {
    detail()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()

    return eventually(() => {
      const found = detail()!.querySelector('.sidebar-info__content [data-cy="button-slot-actions"]')?.closest('button')
      expect(found).toBeTruthy()

      return found!
    })
  }
  let actions = await slotsTab()
  const download = async () => {
    if (!menu()) actions.click()

    return eventually(() => {
      const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
        (listed) => listed.textContent?.trim() === 'Download'
      )
      expect(found).toBeTruthy()

      return found!
    })
  }

  return {
    ...ui,
    download,
    redraw: async () => {
      detail()!.querySelector<HTMLElement>('[data-cy="button-meta"]')!.click()
      await settled()
      actions = await slotsTab()
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  server.assetBy(IMAGE, onServer)
  server.slotsBy(IMAGE, () => ({
    data: [{ id: 'slot-default', slotName: 'default', default: true, main: true, assetFile: fileOnServer('file-3') }],
    totalCount: 1,
  }))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: [onServer()], hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({
    status: 200,
    data: { id: 1, name: 'Licence', extSystem: 1 },
  }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.fileBy('image', 'file-3', () => fileOnServer('file-3'))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('"Download" of the menu of a row of the Slots tab', () => {
  it('opens one tab and asks once when pressed again while the address of the file is asked for', async () => {
    const answer = holdLink()
    const ui = await openDownload()
    const browser = browserOpensTabs()

    ;(await ui.download()).click()
    await settled()
    ;(await ui.download()).click()
    await settled()

    expect([browser.asked().length, server.sent('GET', DOWNLOAD_LINK).length]).toEqual([1, 1])

    await answer()

    expect([browser.given[0].sentTo, ui.alerts()]).toEqual([[{ address: SIGNED, reachesOpener: false }], []])
    ;(await ui.download()).click()
    await settled()
    expect([browser.asked().length, server.sent('GET', DOWNLOAD_LINK).length]).toEqual([2, 2])
  })

  it('says so when the browser gives no tab, and asks for no address', async () => {
    const ui = await openDownload()
    const browser = browserOpensTabs(false)

    ;(await ui.download()).click()
    await settled()

    expect([browser.asked().length, server.sent('GET', DOWNLOAD_LINK).length, ui.alerts()]).toEqual([1, 0, [NO_TAB]])
  })

  // Drawn anew, the row is a different one. What held the second press back went with the row drawn before.
  it('opens one tab and asks once when pressed again in the Slots tab drawn anew meanwhile', async () => {
    const answer = holdLink()
    const ui = await openDownload()
    const browser = browserOpensTabs()

    ;(await ui.download()).click()
    await settled()
    await ui.redraw()
    ;(await ui.download()).click()
    await settled()

    expect([browser.asked().length, server.sent('GET', DOWNLOAD_LINK).length]).toEqual([1, 1])
    await answer()
    expect(browser.given[0].sentTo).toEqual([{ address: SIGNED, reachesOpener: false }])
  })

  it('leaves nothing listening for the page to go when the browser gives no tab', async () => {
    const ui = await openDownload()
    browserOpensTabs(false)
    const added = vi.spyOn(window, 'addEventListener')

    ;(await ui.download()).click()
    await settled()

    expect(added.mock.calls.filter(([type]) => type === 'pagehide')).toEqual([])
  })
})
