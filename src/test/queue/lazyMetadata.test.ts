import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { UploadQueueItemStatus } from '@anzusystems/common-admin'

const fetchAssetListByIds = vi.fn(async (): Promise<unknown[]> => [])

vi.mock('@/domains/coreDam/asset/api/assetApi', () => ({
  fetchAsset: vi.fn(),
  fetchAssetListByIds: () => fetchAssetListByIds(),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
vi.mock('@/domains/coreDam/asset/api/audioApi', () => ({ fetchAudioFile: vi.fn() }))
vi.mock('@/domains/coreDam/asset/api/documentApi', () => ({ fetchDocumentFile: vi.fn() }))
vi.mock('@/domains/coreDam/asset/api/imageApi', () => ({ fetchImageFile: vi.fn() }))
vi.mock('@/domains/coreDam/asset/api/videoApi', () => ({ fetchVideoFile: vi.fn() }))
vi.mock('@/domains/coreDam/shared/services/upload/externalProviderImportService', () => ({
  externalProviderImport: vi.fn(),
}))
vi.mock('@/domains/coreDam/shared/services/upload/uploadService', () => ({
  useUpload: () => ({
    upload: () => new Promise(() => undefined),
    uploadInit: () => new Promise(() => undefined),
    stop: vi.fn(),
  }),
  uploadStop: vi.fn(),
  resolveUploadErrorMessage: () => '',
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

const QUEUE = 'mass-edit'

const listedAsset = (id: string) => ({
  id,
  attributes: { assetType: 'image', assetStatus: 'with_file' },
  texts: { displayTitle: id },
  mainFile: null,
  mainFileSingleUse: null,
})

const detail = (id: string) => ({
  id,
  keywords: [],
  authors: [],
  mainFileSingleUse: null,
  metadata: { customData: {}, authorSuggestions: {} },
})

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())

  return await import('@/domains/coreDam/asset/store/uploadQueuesStore')
}

type QueueRow = {
  status: string
  canEditMetadata: boolean
  error: { hasError: boolean; message: string }
}

const itemsOf = (store: { queues: Record<string, { items: unknown[] }> }) =>
  store.queues[QUEUE].items as QueueRow[]

beforeEach(() => {
  vi.clearAllMocks()
  fetchAssetListByIds.mockResolvedValue([])
})

describe('assets picked for mass edit', () => {
  it('fails the ones the metadata call left out instead of loading them for ever', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // Deleted between the listing and this call, or outside the licence: the response is short.
    fetchAssetListByIds.mockResolvedValue([detail('asset-1')])

    await store.addByAssets(QUEUE, [listedAsset('asset-1'), listedAsset('asset-2')] as never)
    await vi.waitFor(() => expect(itemsOf(store as never)[1].status).not.toBe(UploadQueueItemStatus.Loading))

    const [found, missing] = itemsOf(store as never)
    expect(found.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(found.canEditMetadata).toBe(true)
    // The footer counts `Loading` as unfinished, and nothing else would ever move this one on.
    expect(missing.status).toBe(UploadQueueItemStatus.Failed)
    expect(missing.error.hasError).toBe(true)
    // Its own wording: this row was never uploaded and has no refresh button to be sent to.
    expect(missing.error.message).toBe('system.uploadErrors.metadataUnavailable')
  })

  it('lets a later batch clear what an earlier failed one left on the row', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    fetchAssetListByIds.mockRejectedValueOnce(new Error('the asset service is down'))

    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    await vi.waitFor(() => expect(itemsOf(store as never)[0].status).not.toBe(UploadQueueItemStatus.Loading))
    fetchAssetListByIds.mockResolvedValue([detail('asset-1')])
    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    await vi.waitFor(() => expect(itemsOf(store as never)[0].canEditMetadata).toBe(true))

    // Two selections that overlap fetch the same asset twice; taken in order, as here, the second one has the
    // metadata the first was complaining about, so the warning has to go with it.
    expect(itemsOf(store as never)[0].error.hasError).toBe(false)
  })

  it('fails all of them when the metadata call itself does', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    fetchAssetListByIds.mockRejectedValue(new Error('the asset service is down'))

    await store.addByAssets(QUEUE, [listedAsset('asset-1'), listedAsset('asset-2')] as never)
    await vi.waitFor(() => expect(itemsOf(store as never)[1].status).not.toBe(UploadQueueItemStatus.Loading))

    // Fire-and-forget: a rejection here used to leave every item it was fetching on `Loading`.
    const statuses = itemsOf(store as never).map((item) => item.status)
    expect(statuses).toEqual([UploadQueueItemStatus.Failed, UploadQueueItemStatus.Failed])
  })
})
