import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/* The arrow keys walk the list of assets from its active tile. No tile is active on the way into the page, nor after
 * a list read anew that came without the asset of the active one: the right arrow then picks the first tile, and the
 * left one has nowhere to go. The real page of the list with its real panel and detail, the application around it
 * as it starts; the server is a fake, and so is the address the page asks about a new version of the application. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'

const LIST = '/assets'

/** An asset the server has, in the list and in its detail: a video, its title is its id. */
const onServer = (id: string) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' } }),
  keywords: [],
  authors: [],
})

/** The assets of the list the server has, in their order. */
let listed: string[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

/** An arrow key let go over the page, as the window hears it. */
const arrow = async (key: typeof RIGHT | typeof LEFT) => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

/** The assets the server was asked for one at a time, as the panel reads its own. */
const readAlone = () =>
  server.sent('GET', /^\/adm\/v1\/asset\/asset-\d$/).map((request) => request.url.split('/').pop())

/** The open detail, or null with none open. */
const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

/** What the bar of the open detail says: the place of its asset in the list, when it has one, and its title. */
const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .filter(Boolean)
    .join(' ')

/** The two buttons of the bar of the open detail that walk the list. */
const walk = () => {
  const [previous, next] = Array.from(detail()!.querySelectorAll<HTMLButtonElement>('.v-toolbar button'))

  return { previous, next }
}

/** The page of the list with the assets the server has, none of them picked. */
const openList = async () => {
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
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  /** The tiles as they are drawn now: a list read anew draws new ones. */
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  /** The assets of the tiles, in the order they are drawn in. */
  const order = () => tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())
  await eventually(() => expect(order()).toEqual(listed))
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

  return {
    ...ui,
    tiles,
    /** Which of the tiles is the active one. */
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    /** The asset the panel beside the list holds, as its file card says it: null while it holds none. */
    held: () => panel().querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null,
    /** The list is read anew by its "Refresh", and from now on the server has these assets in it. */
    readAnew: async (...now: string[]) => {
      listed = now
      page.querySelector('.mdi-refresh')!.closest('button')!.click()
      await settled()
      await eventually(() => expect(order()).toEqual(now))
    },
  }
}

beforeEach(() => {
  server = createFakeDam()
  listed = ['asset-1', 'asset-2', 'asset-3']
  for (const id of ['asset-1', 'asset-2', 'asset-3', 'asset-4']) server.asset(onServer(id))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({ status: 200, data: { data: listed.map(onServer), hasNextPage: false } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('GET', /^\/adm\/v1\/(keyword|author)\/ext-system\/1\/search$/, empty)
  // The window is one for the whole file, and so is its address.
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe('the arrow keys of the list while no tile is active', () => {
  it('pick the first tile by the right arrow on the way into the page, and go on from it', async () => {
    const list = await openList()

    await arrow(RIGHT)

    expect([list.active(), list.held(), readAlone()]).toEqual([[true, false, false], 'asset-1', ['asset-1']])

    await arrow(RIGHT)
    expect([list.active(), list.held(), readAlone()]).toEqual([[false, true, false], 'asset-2', ['asset-1', 'asset-2']])
  })

  // The guard of the case above: there is no tile before the first one.
  it('do nothing by the left arrow: nothing is picked, and nothing is read', async () => {
    const list = await openList()

    await arrow(LEFT)

    expect([list.active(), list.held(), readAlone()]).toEqual([[false, false, false], null, []])
  })

  it('pick the first tile by the right arrow after a list read anew without the asset of the active tile', async () => {
    const list = await openList()
    list.tiles()[1].click()
    await settled()
    await list.readAnew('asset-1', 'asset-3', 'asset-4')
    expect([list.active(), list.held()]).toEqual([[false, false, false], 'asset-2'])

    await arrow(LEFT)
    expect([list.active(), list.held(), readAlone()]).toEqual([[false, false, false], 'asset-2', ['asset-2']])

    await arrow(RIGHT)
    expect([list.active(), list.held(), readAlone()]).toEqual([[true, false, false], 'asset-1', ['asset-2', 'asset-1']])
  })

  // The second tile was the one picked: a list of one asset had none to pick.
  it('pick the only tile of a list of one asset by the right arrow', async () => {
    listed = ['asset-1']
    const list = await openList()

    await arrow(RIGHT)

    expect([list.active(), list.held(), readAlone()]).toEqual([[true], 'asset-1', ['asset-1']])
  })

  /* The detail of the list stays open while the list is read anew under it. Its asset gone from the list, no tile is
   * active: its bar says no place, and its two buttons are the two keys. */
  it('are the two buttons of an open detail whose asset the list holds no more: no previous, and the first tile next', async () => {
    const list = await openList()
    list.tiles()[1].querySelectorAll<HTMLButtonElement>('.detail-icon')[1].click()
    await eventually(() => expect(shown()).toBe('2 / 3 asset-2'))
    await list.readAnew('asset-1', 'asset-3', 'asset-4')
    expect([list.active(), shown()]).toEqual([[false, false, false], 'asset-2'])

    expect([walk().previous.disabled, walk().next.disabled]).toEqual([true, false])
    walk().next.click()

    await eventually(() => expect(shown()).toBe('1 / 3 asset-1'))
    expect([list.active(), readAlone()]).toEqual([
      [true, false, false],
      ['asset-2', 'asset-1'],
    ])
  })
})
