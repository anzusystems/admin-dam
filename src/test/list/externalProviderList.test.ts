import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick, ref } from 'vue'

const executeFetch = vi.fn<(...args: unknown[]) => Promise<unknown[]>>(async () => [])

// The rows a page carries say which page it is, so a page fetched twice is visible in the list.
const pageOf = (args: unknown[]) => {
  const pagination = args[0] as { value: { page: number; hasNextPage?: boolean } }
  // What the library does with the pagination object it is handed as it answers.
  pagination.value = { ...pagination.value, hasNextPage }

  return [listItem(`page-${pagination.value.page}`)]
}

let hasNextPage = true

vi.mock('@/domains/coreDam/externalProvider/api/externalProviderAssetApi', () => ({
  useFetchExternalProviderAssetList: () => ({ executeFetch: (...args: unknown[]) => executeFetch(...args) }),
  // The detail fetch destructures `executeRequest`, not `executeFetch`.
  useFetchExternalProviderAsset: () => ({ executeRequest: vi.fn() }),
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigState: () => ({ getDamConfigExtSystem: () => ({ assetExternalProviders: {} }) }),
  useAlerts: () => ({ showWarning: vi.fn(), showErrorsDefault: vi.fn() }),
}))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/composables/externalProviders', () => ({
  useExternalProviders: () => ({ activeExternalProvider: ref('provider-1') }),
}))
const massEditItems = ref<{ type: string; externalProviderAssetId: string }[]>([])
vi.mock('@/domains/coreDam/asset/store/uploadQueuesStore', () => ({
  useUploadQueuesStore: () => ({
    getQueueItems: () => massEditItems.value,
    getQueueTotalCount: () => massEditItems.value.length,
    removeByExternalProviderAssetId: vi.fn(),
    addByExternalProviderAsset: vi.fn(),
    clearQueue: vi.fn(),
  }),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))

const listItem = (id: string) => ({
  id,
  attributes: { assetType: 'image' },
  texts: { displayTitle: id },
})

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useExternalProviderAssetListActions } = await import(
    '@/domains/coreDam/externalProvider/composables/externalProviderAssetListActions'
  )
  const { useExternalProviderAssetListStore } = await import(
    '@/domains/coreDam/externalProvider/store/externalProviderAssetListStore'
  )

  return {
    actions: useExternalProviderAssetListActions(),
    listStore: useExternalProviderAssetListStore(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  massEditItems.value = []
  hasNextPage = true
  executeFetch.mockImplementation(async (...args: unknown[]) => pageOf(args))
})

// This composable is a near copy of the asset list one, and the fixes below were made in both.
describe('the external provider list', () => {
  it('keeps the tile highlight in step with the mass edit queue', async () => {
    const { actions, listStore } = await load()
    void actions
    await actions.fetchAssetList()
    massEditItems.value = [{ type: 'externalProviderAsset', externalProviderAssetId: 'page-1' }]
    await nextTick()
    expect(listStore.list.map((row) => row.selected)).toEqual([true])

    // What the bin in the selection dialog and the import both do, with no way to reach the list.
    massEditItems.value = []
    await nextTick()

    expect(listStore.list.map((row) => row.selected)).toEqual([false])
  })

  it('leaves the newer list on screen, not the one that answered last', async () => {
    const { actions, listStore } = await load()
    let finishOld: (value: unknown[]) => void = () => undefined
    executeFetch.mockImplementationOnce(() => new Promise((resolve) => (finishOld = resolve)))

    const older = actions.fetchAssetList()
    await actions.fetchAssetList()
    finishOld([listItem('stale')])
    await older

    expect(listStore.list.map((row) => row.asset.id)).toEqual(['page-1'])
  })

  it('does not let a next page of a replaced list hold the new one back', async () => {
    const { actions, listStore } = await load()
    await actions.fetchAssetList()
    let finishStalePage: (value: unknown[]) => void = () => undefined
    executeFetch.mockImplementationOnce(() => new Promise((resolve) => (finishStalePage = resolve)))
    const stalePage = actions.fetchNextPage()

    await actions.fetchAssetList()
    // The new list's own scroll, with the old request still on the wire and nothing aborting it.
    let finishNewPage: (value: unknown[]) => void = () => undefined
    executeFetch.mockImplementationOnce(() => new Promise((resolve) => (finishNewPage = resolve)))
    const newPage = actions.fetchNextPage()

    // Four requests: both lists and one next page each.
    expect(executeFetch).toHaveBeenCalledTimes(4)
    finishStalePage([listItem('stale')])
    await stalePage
    // The old one may not take the spinner down under the request that is still running.
    expect(listStore.loader.soft).toBe(true)

    finishNewPage([listItem('page-2')])
    await newPage
    expect(listStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2'])
    expect(listStore.loader.soft).toBe(false)
  })

  it('takes its own spinner down when the filter changed and nothing else will', async () => {
    const { actions, listStore } = await load()
    await actions.fetchAssetList()
    let finishStalePage: (value: unknown[]) => void = () => undefined
    executeFetch.mockImplementationOnce(() => new Promise((resolve) => (finishStalePage = resolve)))
    const stalePage = actions.fetchNextPage()

    await actions.fetchAssetList()
    finishStalePage([listItem('stale')])
    await stalePage

    expect(listStore.loader.soft).toBe(false)
  })

  it('does not let a stale answer tell the new list there is nothing more to load', async () => {
    const { actions, listStore } = await load()
    await actions.fetchAssetList()
    let finishStalePage: (value: unknown[]) => void = () => undefined
    executeFetch.mockImplementationOnce(() => new Promise((resolve) => (finishStalePage = resolve)))
    const stalePage = actions.fetchNextPage()
    const stalePagination = executeFetch.mock.calls.at(-1)?.[0] as { value: { hasNextPage?: boolean } }

    let finishNewList: (value: unknown[]) => void = () => undefined
    executeFetch.mockImplementationOnce(() => new Promise((resolve) => (finishNewList = resolve)))
    const newList = actions.fetchAssetList()
    await actions.fetchNextPage()
    // The stale answer comes back first and writes onto whatever pagination it was handed.
    stalePagination.value = { ...stalePagination.value, hasNextPage: false }
    finishStalePage([listItem('stale')])
    await stalePage
    finishNewList([listItem('page-1')])
    await newList

    // On the shared object that `false` would have dropped the scroll the user made of the new list, and it would
    // have stopped there.
    expect(listStore.list.map((row) => row.asset.id)).toEqual(['page-1', 'page-2'])
  })
})
