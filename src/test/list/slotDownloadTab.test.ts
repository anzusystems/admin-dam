import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, assetFile, createFakeDam, httpError } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* "Download" of the menu of a row of the Slots tab asks the server for the signed address of the file of the row, and
 * opens it in a tab of its own. A browser opens a tab at a press and can drop one opened after a request without a
 * word: the tab is opened at the press, empty, cut off from the page at once, and sent to the address once it is had -
 * or closed when it is not. The real page of the list with its real detail, the application around it as it starts;
 * the server is a fake, and so are the tabs of the browser and the address the page asks about a new version of the
 * application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DOWNLOAD_LINK = /^\/adm\/v1\/image\/([^/]+)\/download-link$/

const SYSTEM_ERROR = 'System error, try again later or contact administrator'
const SIGNED = 'https://storage.test/file-3?signature=1'

const LIST = '/assets'
const IMAGE = 'asset-1'

/** Where a tab is that the user took to another site: such a tab does not say. */
const ANOTHER_SITE = null

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

/** A tab of the browser, as the page that opened it holds it: opened empty. */
const newTab = () => {
  /** Where the tab was sent, each time with whether it could reach the page that opened it by then. */
  const sentTo: Array<{ address: string; reachesOpener: boolean }> = []
  let address: string | null = 'about:blank'
  const tab = {
    opener: window as unknown,
    closed: false,
    close: () => {
      tab.closed = true
    },
    location: {
      get href() {
        if (address === ANOTHER_SITE) {
          throw new DOMException('Blocked a frame from accessing a cross-origin frame.', 'SecurityError')
        }

        return address
      },
      replace: (to: string) => void sentTo.push({ address: to, reachesOpener: tab.opener !== null }),
    },
    sentTo,
    /** The user takes the tab elsewhere, by its address bar. */
    takenTo: (to: string | null) => {
      address = to
    },
  }

  return tab
}

type Tab = ReturnType<typeof newTab>

/** The browser opens tabs from now on: what it was asked for each, and the tabs it gave. */
const browserOpensTabs = () => {
  const given: Tab[] = []
  const open = vi.fn<(...asked: unknown[]) => Tab>(() => {
    given.push(newTab())

    return given.at(-1)!
  })
  vi.stubGlobal('open', open)

  return { asked: () => open.mock.calls, given }
}

/** The address of the file is asked for from now on and held: answered, or refused, by what this gives back. */
const holdLink = () => {
  let answer: (had: boolean) => void = () => undefined
  server.on(
    'GET',
    DOWNLOAD_LINK,
    () =>
      new Promise<FakeDamAnswer>((resolve, reject) => {
        answer = (had) => (had ? resolve({ status: 200, data: { link: SIGNED } }) : reject(httpError(500)))
      })
  )

  return async (had = true) => {
    answer(had)
    await settled()
  }
}

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')
const menu = () => document.body.querySelector('.v-menu.v-overlay--active')

/** The Slots tab of the detail of the image, and the "Download" of the menu of the row of its main slot. */
const openDownload = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    extSystem: { image: { slots: ['default'] } },
    customForm: { image: [customField('title')] },
  })
  // The user as the bar of the page draws them.
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
  detail()!.querySelector<HTMLElement>('[data-cy="button-slots"]')!.click()
  const actions = await eventually(() => {
    const found = detail()!.querySelector('.sidebar-info__content [data-cy="button-slot-actions"]')?.closest('button')
    expect(found).toBeTruthy()

    return found!
  })
  actions.click()
  const download = await eventually(() => {
    const found = Array.from(menu()?.querySelectorAll<HTMLElement>('.v-list-item') ?? []).find(
      (listed) => listed.textContent?.trim() === 'Download'
    )
    expect(found).toBeTruthy()

    return found!
  })

  return { ...ui, download }
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

/* The window was opened only once the address was answered - which a browser blocking such windows dropped without a
 * word - and could reach the page that opened it. */
describe('"Download" of the menu of a row of the Slots tab', () => {
  it('opens its tab at the press, cut off from the page at once, and sends it to the file once its address is had', async () => {
    const answer = holdLink()
    const ui = await openDownload()
    const browser = browserOpensTabs()

    ui.download.click()

    // At the press, with nothing answered yet.
    expect([browser.asked(), browser.given[0]?.opener]).toEqual([[['', '_blank']], null])
    await settled()
    expect([server.sent('GET', DOWNLOAD_LINK).map((request) => request.url), browser.given[0].sentTo]).toEqual([
      ['/adm/v1/image/file-3/download-link'],
      [],
    ])

    await answer()

    expect([browser.given[0].sentTo, browser.given[0].closed, ui.alerts()]).toEqual([
      [{ address: SIGNED, reachesOpener: false }],
      false,
      [],
    ])
  })

  it('closes its tab and says so when the address of the file cannot be had', async () => {
    const answer = holdLink()
    const ui = await openDownload()
    const browser = browserOpensTabs()

    ui.download.click()
    await settled()
    await answer(false)

    expect([browser.given[0].sentTo, browser.given[0].closed, ui.alerts()]).toEqual([[], true, [SYSTEM_ERROR]])
  })

  // The guard: a tab the user has taken elsewhere meanwhile is theirs.
  it('neither sends nor closes a tab the user took to another site while the address was asked for', async () => {
    const answer = holdLink()
    const ui = await openDownload()
    const browser = browserOpensTabs()

    ui.download.click()
    await settled()
    browser.given[0].takenTo(ANOTHER_SITE)
    await answer()

    expect([browser.given[0].sentTo, browser.given[0].closed, ui.alerts()]).toEqual([[], false, []])
  })
})
