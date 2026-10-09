import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import type { Router } from 'vue-router'

import { assetDetail, createFakeDam, queueRow, seedQueue } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* Picking assets in the list for mass edit: a tile toggled on puts its asset into the mass-edit queue, toggled off
 * takes it out, and the queue takes fifty at most. The real list actions and the real queue over a fake server. */

let server: FakeDam
let router: Router
const showWarning = vi.fn()

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('vue-router', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useRouter: () => router,
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamCachedUsers: () => ({ fetchCachedUsers: vi.fn(), addToCachedUsers: vi.fn() }),
  useAlerts: () => ({ showWarning, showErrorsDefault: vi.fn(), showError: vi.fn() }),
}))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 1 } }),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/composables/externalProviders', () => ({
  useExternalProviders: () => ({ activeExternalProvider: { value: null } }),
}))
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))

const EDIT = 'edit'

const listItem = (id: string) => ({
  id,
  attributes: { assetType: 'image', assetStatus: 'with_file' },
  texts: { displayTitle: id },
  mainFile: null,
  mainFileSingleUse: null,
})

const Page = defineComponent(() => () => null)

const load = async (ids = ['asset-a', 'asset-b', 'asset-c']) => {
  vi.resetModules()
  setActivePinia(createPinia())
  // Imported after the reset, so that the router and the library's navigation tracker share one vue-router.
  const { createMemoryHistory, createRouter } = await import('vue-router')
  router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/assets', component: Page }] })
  await router.push('/assets')
  const { useAssetListActions } = await import('@/domains/coreDam/asset/components/list/composables/assetListActions')
  const { useAssetListStore } = await import('@/domains/coreDam/asset/store/assetListStore')
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
  const assetListStore = useAssetListStore()
  assetListStore.setList(ids.map(listItem) as never)
  ids.forEach((id) => server.asset(assetDetail(id)))

  return { actions: useAssetListActions(), assetListStore, store: useUploadQueuesStore() }
}

const flush = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}

beforeEach(() => {
  vi.clearAllMocks()
  server = createFakeDam()
})

describe('a tile of the list toggled for mass edit', () => {
  it('puts its asset into the mass-edit queue, which reads its metadata', async () => {
    const { actions, assetListStore, store } = await load()

    actions.toggleSelected({ assetId: 'asset-b', index: 1 })
    await flush()

    expect(store.getQueueItems(EDIT).map((row) => [row.type, row.assetId, row.status, row.canEditMetadata])).toEqual([
      ['asset', 'asset-b', 'uploaded', true],
    ])
    expect(server.assetReads('asset-b')).toBe(1)
    expect(assetListStore.list.map((tile) => tile.selected)).toEqual([false, true, false])
  })

  it('takes its asset out of the queue when toggled again', async () => {
    const { actions, assetListStore, store } = await load()
    actions.toggleSelected({ assetId: 'asset-a', index: 0 })
    actions.toggleSelected({ assetId: 'asset-b', index: 1 })
    await flush()

    actions.toggleSelected({ assetId: 'asset-a', index: 0 })
    await flush()

    expect(store.getQueueItems(EDIT).map((row) => row.assetId)).toEqual(['asset-b'])
    expect(assetListStore.list.map((tile) => tile.selected)).toEqual([false, true, false])
    expect([store.getQueueProcessedCount(EDIT), store.getQueueTotalCount(EDIT)]).toEqual([1, 1])
  })

  it('is refused with a warning once fifty are picked', async () => {
    const { actions, assetListStore, store } = await load()
    seedQueue(
      store,
      EDIT,
      Array.from({ length: 50 }, (_value, index) =>
        queueRow({ type: 'asset', status: 'uploaded', assetId: 'picked-' + index })
      )
    )

    actions.toggleSelected({ assetId: 'asset-a', index: 0 })
    await flush()

    expect(store.getQueueTotalCount(EDIT)).toBe(50)
    expect(store.getQueueItems(EDIT).some((row) => row.assetId === 'asset-a')).toBe(false)
    expect(assetListStore.list[0].selected).toBe(false)
    expect(showWarning).toHaveBeenCalledTimes(1)
    expect(server.requests).toEqual([])
  })

  it('can still be toggled off when fifty are picked', async () => {
    const { actions, assetListStore, store } = await load()
    seedQueue(store, EDIT, [
      queueRow({ type: 'asset', status: 'uploaded', assetId: 'asset-a' }),
      ...Array.from({ length: 49 }, (_value, index) =>
        queueRow({ type: 'asset', status: 'uploaded', assetId: 'picked-' + index })
      ),
    ])
    await flush()
    expect(assetListStore.list[0].selected).toBe(true)

    actions.toggleSelected({ assetId: 'asset-a', index: 0 })
    await flush()

    expect(store.getQueueTotalCount(EDIT)).toBe(49)
    expect(assetListStore.list[0].selected).toBe(false)
    expect(showWarning).not.toHaveBeenCalled()
  })
})

describe('a range of tiles picked from the active one', () => {
  it('replaces the selection with the assets of the range', async () => {
    const { actions, assetListStore, store } = await load()
    actions.toggleSelected({ assetId: 'asset-c', index: 2 })
    await flush()
    assetListStore.setActiveByIndex(0)

    actions.selectMultiple({ assetId: 'asset-b', index: 1 })
    await flush()

    expect(store.getQueueItems(EDIT).map((row) => row.assetId)).toEqual(['asset-a', 'asset-b'])
    expect(assetListStore.list.map((tile) => tile.selected)).toEqual([true, true, false])
    expect([server.assetReads('asset-a'), server.assetReads('asset-b')]).toEqual([1, 1])
  })
})
