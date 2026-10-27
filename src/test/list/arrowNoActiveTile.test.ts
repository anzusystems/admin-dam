import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RouterView } from 'vue-router'

import { assetDetail, createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { customField, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The arrow keys walk the list from its active tile. No tile is active on entering the page, nor after
 * a list read anew without the active asset. Then right picks the first tile and left does nothing.
 * Real list page, panel and detail. The server and the app-version address are fakes.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence\/1(\/search)?$/

const RIGHT = 'ArrowRight'
const LEFT = 'ArrowLeft'

const LIST = '/assets'

const onServer = (id: string) => ({
  ...assetDetail(id, { attributes: { assetType: 'video', assetStatus: 'with_file' } }),
  keywords: [],
  authors: [],
})

let listed: string[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

const arrow = async (key: typeof RIGHT | typeof LEFT) => {
  document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  await settled()
}

const readAlone = () =>
  server.sent('GET', /^\/adm\/v1\/asset\/asset-\d$/).map((request) => request.url.split('/').pop())

const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail-dialog.v-overlay--active')

const shown = () =>
  Array.from(detail()?.querySelectorAll('.v-toolbar .text-label-large > div') ?? [])
    .map((part) => part.textContent?.trim())
    .filter(Boolean)
    .join(' ')

const walk = () => {
  const [previous, next] = Array.from(detail()!.querySelectorAll<HTMLButtonElement>('.v-toolbar button'))

  return { previous, next }
}

const openList = async () => {
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
  await ui.router.push(LIST)
  const page = await ui.mount(async () => ({ default: RouterView }))
  const tiles = () => Array.from(page.querySelectorAll<HTMLElement>('.dam-image-grid__item'))
  const order = () => tiles().map((tile) => tile.querySelector('.text-truncate')?.textContent?.trim())
  await eventually(() => expect(order()).toEqual(listed))
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!

  return {
    ...ui,
    tiles,
    active: () => tiles().map((tile) => tile.classList.contains('dam-image-grid__item--active')),
    held: () => panel().querySelector('.anzu-copy-text > span')?.textContent?.trim() ?? null,
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

  it('pick the only tile of a list of one asset by the right arrow', async () => {
    listed = ['asset-1']
    const list = await openList()

    await arrow(RIGHT)

    expect([list.active(), list.held(), readAlone()]).toEqual([[true], 'asset-1', ['asset-1']])
  })

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
