import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The file of an asset is downloaded by a link of the detail. The server signs the address of the link for a while
 * only, and the storage it leads to can refuse it, or be down: the link opens in another tab of the browser, one with
 * no way back to the application, so whatever the storage answers stays there, and the application where it is. The
 * page of the list, which makes the browser ask before metadata typed and not saved are lost, has then nothing to
 * let be for a download: a window that goes right after a press of the link is asked about as at any other time.
 * The real page of the list with its real detail, the application around it as it starts; the server is a fake, and
 * so is the address the page asks about a new version of the application. What a browser does with the other tab is
 * not seen here: the browser of the test follows the link by asking for a window to open, and is given none. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DOWNLOAD_LINK = /^\/adm\/v1\/video\/file-1\/download-link$/
/** The address the server signs for the download of a file, on another origin. */
const SIGNED = 'https://storage.test/file-1?signature=1'

const LIST = '/assets'

/** An asset the server has, in the list and in its detail: a video, its title is its id. */
const onServer = (id: string) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' } }),
  keywords: [],
  authors: [],
})

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** What the browser is told when the window is about to go - a reload, a closed tab: true when it is to ask first. */
const windowAsksBeforeItGoes = () => {
  const going = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(going)

  return going.defaultPrevented
}

/** What the browser of the test opened to follow a link: for each press the address, the window and its features. */
let followed: unknown[][] = []

/* The browser of the test follows a pressed link by opening its address in the window the link names - `_self`, the
 * tab of the application, for a link that names none. An assignment, not a stub of the global: only that reaches the
 * window the browser of the test asks. */
const open = window.open
const browserFollowsLinks = () => {
  followed = []
  window.open = (...asked: unknown[]) => {
    followed.push(asked)

    return null
  }
}

/** The detail of the second asset of the list with metadata typed into it, and the link of its file in the open
 * dialog of the download. */
const withTheLinkOfTheFile = async () => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update'],
    customForm: { video: [customField('title')] },
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
  /* Followed in the tab of the application, a signed address that has run out, or a storage that is down, put its
   * own page in the place of the application, and what was typed there was gone. */
  it('opens in another tab of the browser, which has no way back to the application', async () => {
    const link = await withTheLinkOfTheFile()

    browserFollowsLinks()

    link.click()

    // What the link says of itself, and where a press of it is followed: another tab, not the one of the application.
    expect({
      link: [link.getAttribute('href'), link.getAttribute('target'), link.getAttribute('rel')],
      followed,
    }).toEqual({
      link: [SIGNED, '_blank', 'noopener noreferrer'],
      followed: [[SIGNED, '_blank', 'noreferrer,noopener']],
    })
  })

  /* While the link was followed in the tab of the application, the page let the one unload be that the browser
   * announces for a download, for a moment after each press: a reload in that moment went unasked. */
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
