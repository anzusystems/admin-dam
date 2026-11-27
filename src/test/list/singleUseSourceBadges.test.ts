import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { RouterView } from 'vue-router'

import { assetDetail, createFakeDam, queueRow } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamAnswer } from '@/test/support/fakeDam'
import { buttonsNamed, eventually, startUploadUi, stopUploadUi } from '@/test/support/uploadUi'

/*
 * The "1×" badge of a single use asset and the badges of its sources on the tiles and rows of the asset list
 * (#87269, #87709), and the single use core-dam saved, which a form save hands to the switch, the tile and the
 * asset's queue row. A licence that enforces single use turns it on whatever was sent.
 * The real list page with its panel and detail. The server is a fake.
 */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))

const SEARCH = /^\/adm\/v1\/asset\/licence(\/1)?(\/search)?$/
const BULK = /^\/adm\/v1\/asset\/metadata-bulk-update$/
const SOURCES = /^\/adm\/v1\/author\/ext-system\/1\/search$/
const UPDATED = 'Record was updated'
const SWITCH = 'Single-use license'
// The title of the "1×" badge, a text of common-admin.
const SINGLE_USE = 'common.damImage.asset.metaIcons.singleUse'
const LIST = '/assets'

const source = (id: string, name: string, badge: string, priority: number) => ({
  id,
  name,
  identifier: '',
  flags: { reviewed: true, hiddenInCredit: false, source: true },
  type: 'none',
  priority,
  badge,
  currentAuthors: [],
  childAuthors: [],
})

const SOURCE_LIST = [
  source('source-low', 'Low agency', 'LOW', 10),
  source('source-high', 'High agency', 'HIGH', 500),
  source('source-none', 'No badge agency', '', 1000),
]

const onServer = (id: string, over: Record<string, unknown> = {}) => ({
  ...assetDetail(id, { attributes: { assetType: 'image', assetStatus: 'with_file' }, ...over }),
  keywords: [],
  authors: [],
  assetFileProperties: { distributesInServices: [], slotNames: [], fromRss: false, width: 0, height: 0 },
  podcasts: [],
})

let assets: ReturnType<typeof onServer>[] = []

const settled = () => vi.advanceTimersByTimeAsync(100)

const openList = async (view: 'tiles' | 'table' = 'tiles') => {
  const ui = await startUploadUi({
    server,
    grants: ['dam_asset_update', 'dam_image_update'],
    queues: { 'some-queue': [queueRow({ type: 'asset', status: 'uploaded', assetId: 'asset-2' })] },
  })
  // The instance the started UI uses: each start evaluates modules anew.
  const { i18n } = await import('@/plugins/i18n')
  expect(i18n.global.te(SINGLE_USE)).toBe(true)
  const { useAuth } = await import('@/domains/system/auth/auth')
  const { currentUser, setCurrentUser } = useAuth().useCurrentUser('dam')
  setCurrentUser({
    ...currentUser.value,
    email: 'user@dam.test',
    person: { firstName: 'Test', lastName: 'User', fullName: 'Test User' },
    avatar: { color: '', text: 'TU' },
  } as never)
  vi.stubGlobal('fetch', async () => ({
    ok: true,
    headers: { get: () => 'application/json' },
    json: async () => ({ appVersion: '' }),
  }))
  if (view === 'table') {
    const { GridView, useGridView } = await import('@/domains/system/composables/gridView')
    useGridView().setGridView(GridView.Table)
  }
  const View = (await import('@/domains/coreDam/asset/components/list/AssetListView.vue')).default
  ui.router.addRoute({ path: LIST, name: '/(coreDam)/assets', component: View })
  ui.router.addRoute({ path: '/settings', component: { render: () => null } })
  await ui.router.push(LIST)
  const onThePage = ref(true)
  const page = await ui.mount(async () => ({
    default: defineComponent({ setup: () => () => (onThePage.value ? h(RouterView) : null) }),
  }))
  const TILE = view === 'table' ? '.a-table__row' : '.dam-image-grid__item'
  const tiles = await eventually(() => {
    const found = Array.from(page.querySelectorAll<HTMLElement>(TILE))
    expect(found).toHaveLength(3)

    return found
  })
  const panel = () => document.body.querySelector<HTMLElement>('.v-navigation-drawer--right')!
  const detail = () => document.body.querySelector<HTMLElement>('.dam-image-detail')
  const switchIn = (within: HTMLElement) =>
    Array.from(within.querySelectorAll<HTMLElement>('.v-switch'))
      .find((control) => control.textContent?.includes(SWITCH))!
      .querySelector<HTMLInputElement>('input')!

  return {
    ...ui,
    t: (key: string) => i18n.global.t(key),
    tiles,
    panel,
    detail,
    switchIn,
    pick: async (index: number) => {
      tiles[index].click()
      await settled()
    },
    pencil: (index: number) => tiles[index].querySelectorAll<HTMLButtonElement>('.detail-icon')[1],
    badges: (index: number) =>
      Array.from(tiles[index].querySelectorAll<HTMLElement>('.asset-image__licence-badge')).map((badge) => [
        badge.dataset.cy,
        badge.textContent?.trim(),
        badge.getAttribute('title'),
      ]),
  }
}

beforeEach(() => {
  server = createFakeDam()
  assets = [
    onServer('asset-1', { sources: ['source-low', 'source-high', 'source-none'], mainFileSingleUse: true }),
    onServer('asset-2', { sources: [], mainFileSingleUse: false }),
    onServer('asset-3', { sources: [], mainFileSingleUse: false }),
  ]
  assets.forEach((asset) => server.asset(asset))
  const empty = (): FakeDamAnswer => ({ status: 200, data: { data: [] } })
  server.on('GET', SEARCH, () => ({
    status: 200,
    data: { data: assets.map((asset) => structuredClone(asset)), hasNextPage: false },
  }))
  server.on('GET', SOURCES, () => ({ status: 200, data: { data: structuredClone(SOURCE_LIST) } }))
  server.on('GET', /^\/adm\/v1\/asset-licence\/1$/, () => ({ status: 200, data: { id: 1, name: 'Licence' } }))
  server.on('GET', /^\/adm\/v1\/ext-system\/1$/, () => ({ status: 200, data: { id: 1, name: 'Ext system' } }))
  server.on('GET', /^\/adm\/v1\/distribution\/asset(-file)?\/[^/]+$/, empty)
  server.on('PATCH', BULK, (request) => ({ status: 200, data: JSON.parse(request.data as string) }))
  window.history.replaceState(null, '', LIST)
})

afterEach(() => {
  stopUploadUi()
})

describe.each(['tiles', 'table'] as const)('the asset list as %s', (view) => {
  it('shows the badges of the sources, by their priority in the credit, then "1×" for a single use asset', async () => {
    const list = await openList(view)

    await eventually(() =>
      expect(list.badges(0)).toEqual([
        ['asset-source-badge', 'HIGH', 'Source: High agency'],
        ['asset-source-badge', 'LOW', 'Source: Low agency'],
        ['asset-single-use-badge', '1×', list.t(SINGLE_USE)],
      ])
    )
    expect(list.badges(1)).toEqual([])
    // The list read asks for the sources of its page once, as a batch.
    expect(server.sent('GET', SOURCES)).toHaveLength(1)
  })
})

describe('the single use core-dam saved', () => {
  // A licence that enforces single use: core-dam saves it on whatever was sent.
  const enforcing = () =>
    server.on('PATCH', BULK, (request) => ({
      status: 200,
      data: (JSON.parse(request.data as string) as Array<Record<string, unknown>>).map((item) => ({
        ...item,
        mainFileSingleUse: true,
      })),
    }))

  it('turns on the switch of the panel, the badge of the tile and the queue row of the asset', async () => {
    enforcing()
    const list = await openList()
    await list.pick(1)
    expect(list.switchIn(list.panel()).checked).toBe(false)

    buttonsNamed(list.panel(), 'Save')[0].click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    expect((JSON.parse(server.sent('PATCH', BULK)[0].data as string) as unknown[])[0]).toMatchObject({
      id: 'asset-2',
      mainFileSingleUse: false,
    })
    expect(list.switchIn(list.panel()).checked).toBe(true)
    expect(list.badges(1)).toEqual([['asset-single-use-badge', '1×', list.t(SINGLE_USE)]])
    expect(list.store.getQueueItems('some-queue')[0].mainFileSingleUse).toBe(true)
  })

  it('does the same after a save in the detail', async () => {
    enforcing()
    const list = await openList()
    list.pencil(1).click()
    const detail = await eventually(() => {
      expect(list.detail()).not.toBeNull()

      return list.detail()!
    })
    await settled()

    buttonsNamed(detail, 'Save')[0].click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    expect(list.switchIn(list.detail()!).checked).toBe(true)
    expect(list.badges(1)).toEqual([['asset-single-use-badge', '1×', list.t(SINGLE_USE)]])
    expect(list.store.getQueueItems('some-queue')[0].mainFileSingleUse).toBe(true)
  })

  it('takes the switch off when core-dam saved it off', async () => {
    const list = await openList()
    await list.pick(0)
    expect(list.switchIn(list.panel()).checked).toBe(true)
    list.switchIn(list.panel()).click()
    await nextTick()

    buttonsNamed(list.panel(), 'Save')[0].click()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    expect(list.switchIn(list.panel()).checked).toBe(false)
    await eventually(() =>
      expect(list.badges(0).map(([cy]) => cy)).toEqual(['asset-source-badge', 'asset-source-badge'])
    )
  })

  it('leaves the switch as it is when it was changed while the save was on the wire', async () => {
    let answer: () => void = () => undefined
    server.on(
      'PATCH',
      BULK,
      (request) =>
        new Promise<FakeDamAnswer>(
          (resolve) => (answer = () => resolve({ status: 200, data: JSON.parse(request.data as string) }))
        )
    )
    const list = await openList()
    await list.pick(1)
    buttonsNamed(list.panel(), 'Save')[0].click()
    await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
    list.switchIn(list.panel()).click()
    await nextTick()
    expect(list.switchIn(list.panel()).checked).toBe(true)

    answer()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    // The switch keeps the change for the next save. The tile shows what core-dam saved.
    expect(list.switchIn(list.panel()).checked).toBe(true)
    expect(list.badges(1)).toEqual([])
  })

  it('leaves the switch of another asset the panel holds by the answer', async () => {
    let answer: () => void = () => undefined
    server.on(
      'PATCH',
      BULK,
      (request) =>
        new Promise<FakeDamAnswer>(
          (resolve) =>
            (answer = () =>
              resolve({
                status: 200,
                data: [
                  {
                    ...(JSON.parse(request.data as string) as Array<Record<string, unknown>>)[0],
                    mainFileSingleUse: true,
                  },
                ],
              }))
        )
    )
    const list = await openList()
    await list.pick(1)
    buttonsNamed(list.panel(), 'Save')[0].click()
    await eventually(() => expect(server.sent('PATCH', BULK)).toHaveLength(1))
    await list.pick(2)
    await eventually(() => expect(server.assetReads('asset-3')).toBe(1))
    await settled()

    answer()
    await eventually(() => expect(list.alerts()).toEqual([UPDATED]))

    expect(list.switchIn(list.panel()).checked).toBe(false)
    expect(list.badges(1)).toEqual([['asset-single-use-badge', '1×', list.t(SINGLE_USE)]])
    expect(list.badges(2)).toEqual([])
  })
})
