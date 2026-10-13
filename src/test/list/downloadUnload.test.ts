import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The file of an asset is downloaded by a link of the detail, followed in the tab of the page. The server answers it
 * as an attachment and the page stays, but the browser announces it as it announces any navigation: the page of the
 * list, which makes the browser ask before metadata typed and not saved are lost, lets that one announcement be
 * (`sidebarUnsavedLeave.test.ts`). Here is what counts as a press of the link that is followed in this tab, and for
 * how many announcements and how long a press counts. The real page of the list with its real detail, the
 * application around it as it starts; the server is a fake, and so is the address the page asks about a new version
 * of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/
const DOWNLOAD_LINK = /^\/adm\/v1\/video\/file-1\/download-link$/
/** The address the server signs for the download of a file: answered as an attachment, on another origin. */
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

/* The window of the test follows a link of its own tab by taking the address of the link, the file it would download
 * in a browser: put back after each case. */
const home = window.location.href

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
  ;(window as unknown as { happyDOM: { setURL: (url: string) => void } }).happyDOM.setURL(home)
  stopUploadUi()
})

describe('metadata typed and not saved, when a file is downloaded from the detail', () => {
  // The guard of the cases below: with the link not pressed a window that goes is asked about, and a plain press is not.
  it('make the browser ask before the window goes, but not for the one unload a plain press of the link announces', async () => {
    const link = await withTheLinkOfTheFile()
    expect(windowAsksBeforeItGoes()).toBe(true)

    link.click()
    await vi.advanceTimersByTimeAsync(300)

    expect([windowAsksBeforeItGoes(), windowAsksBeforeItGoes()]).toEqual([false, true])
  })

  /* With a modifier key held, or by another button, the browser does not follow the link in this tab: it opens it
   * elsewhere or saves it, and announces nothing here. Such a press must not let the next unload be. */
  it.each<[string, MouseEventInit]>([
    ['Ctrl held', { ctrlKey: true }],
    ['Cmd held', { metaKey: true }],
    ['Shift held', { shiftKey: true }],
    ['Alt held', { altKey: true }],
    ['another button of the mouse', { button: 1 }],
  ])('make it ask after a press of the link with %s: the page is not unloaded for that one', async (_how, held) => {
    const link = await withTheLinkOfTheFile()

    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...held }))
    await vi.advanceTimersByTimeAsync(300)

    expect(windowAsksBeforeItGoes()).toBe(true)
  })

  // Each press is one download, and the browser announces each of them.
  it('do not make it ask for either of two downloads pressed one after the other, and do for a third unload', async () => {
    const link = await withTheLinkOfTheFile()

    link.click()
    link.click()
    await vi.advanceTimersByTimeAsync(300)

    expect([windowAsksBeforeItGoes(), windowAsksBeforeItGoes(), windowAsksBeforeItGoes()]).toEqual([false, false, true])
  })

  // And each counts for its own second: the older of two has passed here, the newer has not.
  it('make it ask once for two downloads of which the first was pressed more than a moment ago', async () => {
    const link = await withTheLinkOfTheFile()

    link.click()
    await vi.advanceTimersByTimeAsync(700)
    link.click()
    await vi.advanceTimersByTimeAsync(500)

    expect([windowAsksBeforeItGoes(), windowAsksBeforeItGoes()]).toEqual([false, true])
  })

  /* The second of a press is measured, not read off the clock of the wall, which the user and the system can set:
   * set back, it would keep a press counting; set forward, it would end it at once. */
  it.each<[string, number, number, boolean]>([
    ['back', -60_000, 1_500, true],
    ['forward', 3_600_000, 300, false],
  ])('count the moment of a download by time passed, with the clock set %s meanwhile', async (_way, by, wait, asks) => {
    const link = await withTheLinkOfTheFile()

    link.click()
    vi.setSystemTime(Date.now() + by)
    await vi.advanceTimersByTimeAsync(wait)

    expect(windowAsksBeforeItGoes()).toBe(asks)
  })
})
