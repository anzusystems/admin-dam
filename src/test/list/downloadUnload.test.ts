import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The download link opens in another tab with no way back to the application.
 * The signed address expires, and the storage can refuse it or be down. Whatever it answers stays in that tab.
 * The `beforeunload` prompt for unsaved metadata must still apply right after a press of the link.
 * The test browser follows the link by asking for a window and gets none, so what the other tab does is not tested.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DOWNLOAD_LINK = /^\/adm\/v1\/video\/file-1\/download-link$/
const SIGNED = 'https://storage.test/file-1?signature=1'

const LIST = '/assets'

const onServer = (id: string) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' } }),
  keywords: [],
  authors: [],
})

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

const windowAsksBeforeItGoes = () => {
  const going = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(going)

  return going.defaultPrevented
}

let followed: unknown[][] = []

/*
 * The test browser follows a pressed link by opening its address in the window the link names, `_self` if none.
 * `window.open` is assigned, not stubbed on the global: only that reaches the window the test browser asks.
 */
const open = window.open
const browserFollowsLinks = () => {
  followed = []
  window.open = (...asked: unknown[]) => {
    followed.push(asked)

    return null
  }
}

const withTheLinkOfTheFile = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update'],
    customForm: { video: [customField('title')] },
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
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = await eventually(() => {
    const found = page.querySelectorAll<HTMLElement>('.dam-image-grid__item')
    expect(found).toHaveLength(3)

    return found
  })
  tiles[1].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
  const title = await eventually(() => {
    const field = detail()?.querySelector<HTMLTextAreaElement>('textarea')
    expect(field).toBeTruthy()

    return field!
  })
  title.value = 'typed and not saved'
  title.dispatchEvent(new Event('input'))
  await nextTick()
  detail()!.querySelector<HTMLButtonElement>('[data-cy="button-download"]')!.click()

  return eventually(() => {
    const link = document.body.querySelector<HTMLAnchorElement>('[data-cy="button-download-file"]')
    expect(link?.getAttribute('href')).toBe(SIGNED)

    return link!
  })
}

beforeEach(() => {
  server = createFakeDam()
  const listed = ['asset-1', 'asset-2', 'asset-3']
  for (const id of listed) server.asset(onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: listed.map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  server.on('GET', DOWNLOAD_LINK, () => ({ status: 200, data: { link: SIGNED } }))
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  window.open = open
  stopUploadUi()
})

describe('the link that downloads the file of an asset from its detail', () => {
  /*
   * Followed in the application tab, an expired signed address or a
   * storage that is down replaced the application with its own page.
   * Typed metadata was lost.
   */
  it('opens in another tab of the browser, which has no way back to the application', async () => {
    const link = await withTheLinkOfTheFile()

    browserFollowsLinks()

    link.click()

    expect({
      link: [link.getAttribute('href'), link.getAttribute('target'), link.getAttribute('rel')],
      followed,
    }).toEqual({
      link: [SIGNED, '_blank', 'noopener noreferrer'],
      followed: [[SIGNED, '_blank', 'noreferrer,noopener']],
    })
  })

  /*
   * The page used to allow the unload the browser announces for a download, for a moment after each press.
   * A reload in that moment went unasked.
   */
  it('leaves the window asking before it goes, with metadata typed and not saved, also right after a press', async () => {
    const link = await withTheLinkOfTheFile()
    expect(windowAsksBeforeItGoes()).toBe(true)
    browserFollowsLinks()

    link.click()

    expect([windowAsksBeforeItGoes(), windowAsksBeforeItGoes()]).toEqual([true, true])
    await vi.advanceTimersByTimeAsync(300)
    expect(windowAsksBeforeItGoes()).toBe(true)
  })
})
