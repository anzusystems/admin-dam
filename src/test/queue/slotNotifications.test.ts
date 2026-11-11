import { AssetFileFailReason, UploadQueueItemStatus, UploadQueueItemType } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { immediateScheduler } from '@/test/support/immediateScheduler'

const assetWithItsFile = (): unknown => ({
  id: 'asset-1',
  attributes: { assetStatus: 'with_file' },
  mainFile: { id: 'file-1', links: {} },
  mainFileSingleUse: null,
})
const fetchAsset = vi.fn(async (): Promise<unknown> => assetWithItsFile())

vi.mock('@/domains/coreDam/asset/api/assetApi', () => ({
  fetchAsset: () => fetchAsset(),
  fetchAssetListByIds: vi.fn(async () => []),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
vi.mock('@/domains/coreDam/asset/api/audioApi', () => ({ fetchAudioFile: vi.fn() }))
vi.mock('@/domains/coreDam/asset/api/documentApi', () => ({ fetchDocumentFile: vi.fn() }))
const fetchImageFile = vi.fn(async (): Promise<unknown> => null)
vi.mock('@/domains/coreDam/asset/api/imageApi', () => ({ fetchImageFile: () => fetchImageFile() }))
vi.mock('@/domains/coreDam/asset/api/videoApi', () => ({ fetchVideoFile: vi.fn() }))
vi.mock('@/domains/coreDam/shared/services/upload/externalProviderImportService', () => ({
  externalProviderImport: vi.fn(),
}))
const startedUploads = vi.fn()
const runningUpload = vi.hoisted(() => ({ fail: undefined as undefined | ((error: Error) => void) }))
vi.mock('@/domains/coreDam/shared/services/upload/uploadService', () => ({
  // Never settles unless a test fails it while sending.
  // An upload that resolves at once sends `processUpload` back into
  // the waiting item it just started, and the loop never ends.
  useUpload: (item: { status: string }) => {
    startedUploads()

    return {
      upload: () => new Promise((_resolve, reject) => (runningUpload.fail = reject)),
      // Like the real one: a started row is `uploading` at once, so nothing takes it for a waiting one again.
      uploadInit: () => {
        item.status = 'uploading'

        return Promise.resolve()
      },
      stop: vi.fn(),
      finishAttempted: () => false,
    }
  },
  uploadStop: vi.fn(),
  resolveUploadErrorMessage: () => 'the upload failed',
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

const QUEUE = 'slots'

const slotItem = (over: Record<string, unknown>) => ({
  key: String(over.fileId ?? 'waiting'),
  type: UploadQueueItemType.SlotFile,
  status: UploadQueueItemStatus.Uploading,
  assetId: 'asset-1',
  fileId: null,
  slotName: 'image_1',
  file: null,
  isDuplicate: false,
  keywords: [],
  authors: [],
  customData: {},
  authorConflicts: [],
  canEditMetadata: false,
  progress: { remainingTime: null, progressPercent: null, speed: null },
  error: { hasError: false, message: '', assetFileFailReason: 'none' },
  notificationFallbackTimer: undefined,
  notificationFallbackTry: 1,
  mainFileSingleUse: null,
  mainFileInternal: null,
  assetStatus: null as string | null,
  ...over,
})

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  // The store reads the asset a notification names shortly after it.
  // Here that is the next microtask, so a case that awaits the store has the read behind it.
  // The poll of a queue never runs.
  const { uploadSettlementRuntime } = await import('@anzusystems/common-admin')
  uploadSettlementRuntime.scheduler = immediateScheduler()

  return await import('@/domains/coreDam/asset/store/uploadQueuesStore')
}

const seed = (store: { queues: Record<string, unknown> }, items: unknown[]) => {
  store.queues[QUEUE] = {
    items,
    totalCount: items.length,
    processedCount: 0,
    fileInputKey: 0,
    suggestions: { newKeywordNames: new Set(), newAuthorNames: new Set() },
  }
}

const METADATA_FAILED = 'system.uploadErrors.metadataFailed'

/**
 * The asset cannot be read three times. From the third failure a row that misses its metadata says so.
 * A failed read is retried by itself after 15 and 30 seconds; here a notification brings each try.
 */
const metadataUnreadable = async (store: { queueItemMetadataProcessed: (assetId: string) => Promise<void> }) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))
    await store.queueItemMetadataProcessed('asset-1')
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  // `clearAllMocks` keeps what a case told a mock to answer.
  // Without this reset, the answer one case sets leaks into every later case.
  fetchAsset.mockReset()
  fetchAsset.mockImplementation(async () => assetWithItsFile())
  fetchImageFile.mockReset()
  fetchImageFile.mockImplementation(async () => null)
})

describe('slot uploads of one asset', () => {
  it('settles only the item holding the file the event names', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const uploading = slotItem({ fileId: 'file-1' })
    const other = slotItem({ fileId: 'file-2', slotName: 'image_2' })
    seed(store as never, [uploading, other])

    await store.queueItemProcessed('asset-1', 'file-1')

    expect(uploading.status).toBe(UploadQueueItemStatus.Uploaded)
    // The slots share the asset and differ only in the file.
    // Without matching on the file, the first result marked the second slot finished too.
    expect(other.status).toBe(UploadQueueItemStatus.Uploading)
  })

  it('leaves a queued upload alone until it has a file of its own', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const uploading = slotItem({ fileId: 'file-1' })
    // Only two uploads run at a time, so a third waits with no `fileId`.
    // Matching on the asset alone marked a slot finished whose file was never sent.
    const waiting = slotItem({ fileId: null, status: UploadQueueItemStatus.Waiting, slotName: 'image_3' })
    seed(store as never, [uploading, waiting])

    await store.queueItemProcessed('asset-1', 'file-1')

    expect(waiting.status).toBe(UploadQueueItemStatus.Uploading)
  })

  it('leaves a queued upload alone when the refresh knows no file either', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // The refresh button carries no file id and a queued slot has none yet.
    // Two nulls must not match.
    const waiting = slotItem({ fileId: null, status: UploadQueueItemStatus.Waiting })
    seed(store as never, [waiting])

    await store.queueItemProcessed('asset-1')

    expect(waiting.status).toBe(UploadQueueItemStatus.Waiting)
  })

  it('brings an asset picked for mass edit up to date without settling it', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({
      fileId: null,
      type: UploadQueueItemType.Asset,
      slotName: null,
      mainFileSingleUse: true,
    })
    seed(store as never, [item])

    await store.queueItemProcessed('asset-1', 'file-1')

    // The status of such a row belongs to the batch load.
    // The event brings only the asset status and the preview.
    // Settling a row the batch had failed would show it as finished with the failure still on it.
    expect(item.assetStatus).toBe('with_file')
    expect(item.status).toBe(UploadQueueItemStatus.Uploading)
    expect(item.mainFileSingleUse).toBe(true)
  })

  it('does not fail an asset picked for mass edit on a file of somebody else', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const massEdit = slotItem({
      fileId: null,
      type: UploadQueueItemType.Asset,
      slotName: null,
      status: UploadQueueItemStatus.Uploaded,
    })
    seed(store as never, [massEdit])

    store.queueItemFailed('asset-1', AssetFileFailReason.Unknown, 'file-9')

    // A slot upload into the same asset at the same moment would otherwise fail a healthy row.
    // The event does not say whether its file is the main one of the asset.
    expect(massEdit.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(massEdit.error.hasError).toBe(false)
  })

  it('fills only the slots that are free', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const running = slotItem({ fileId: 'file-1' })
    const waitingOne = slotItem({ fileId: null, status: UploadQueueItemStatus.Waiting, slotName: 'image_2' })
    const waitingTwo = slotItem({ fileId: null, status: UploadQueueItemStatus.Waiting, slotName: 'image_3' })
    seed(store as never, [running, waitingOne, waitingTwo])
    startedUploads.mockClear()

    store.processUpload(QUEUE)

    // Two uploads at a time, counting the ones already running.
    // Starting two regardless pushed the number up under a long queue.
    expect(startedUploads).toHaveBeenCalledTimes(1)
  })

  it('leaves an asset picked for mass edit alone while the batch load still owns it', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // Added by asset a moment ago, its metadata batch is still in flight.
    // A row that already has a main file takes the same route as an ordinary upload, so both must be covered.
    const loading = slotItem({
      fileId: null,
      type: UploadQueueItemType.Asset,
      slotName: null,
      status: UploadQueueItemStatus.Loading,
    })
    const loadingWithFile = slotItem({
      fileId: 'file-1',
      type: UploadQueueItemType.Asset,
      slotName: null,
      status: UploadQueueItemStatus.Loading,
    })
    seed(store as never, [loading, loadingWithFile])

    await store.queueItemProcessed('asset-1', 'file-1')
    store.queueItemFailed('asset-1', AssetFileFailReason.Unknown, 'file-1')

    // Taking the row off `Loading` here makes the batch failure handler skip it.
    // The row would then look finished with no metadata, and the bulk save skips it silently.
    expect(loading.status).toBe(UploadQueueItemStatus.Loading)
    expect(loadingWithFile.status).toBe(UploadQueueItemStatus.Loading)
  })

  it('still settles an ordinary upload on the asset alone', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1', type: UploadQueueItemType.File, slotName: null })
    seed(store as never, [item])

    await store.queueItemProcessed('asset-1')

    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
  })

  it('never settles a slot upload on the asset alone', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1' })
    seed(store as never, [item])

    // An asset has many slots, and a refresh of the asset does not say which one finished.
    // Letting it through would mark a slot done on unrelated news.
    await store.queueItemProcessed('asset-1')

    expect(item.status).toBe(UploadQueueItemStatus.Uploading)
  })
})

describe('a processed notification', () => {
  it('settles the item even when the asset cannot be read afterwards', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1' })
    seed(store as never, [item])
    fetchAsset.mockRejectedValue(new Error('the asset service is down'))

    await store.queueItemProcessed('asset-1', 'file-1')

    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
  })

  it('settles it for an asset that has no main file at all', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1' })
    seed(store as never, [item])
    fetchAsset.mockResolvedValue({
      id: 'asset-1',
      attributes: { assetStatus: 'draft' },
      mainFile: null,
      mainFileSingleUse: null,
    } as never)

    await store.queueItemProcessed('asset-1', 'file-1')

    // Gating the transition on `asset.mainFile` left the upload of a draft asset running forever.
    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
  })
})

describe('settling one item', () => {
  it('starts whatever was waiting for the slot it freed', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const finishing = slotItem({ fileId: 'file-1', status: UploadQueueItemStatus.Processing })
    const waiting = slotItem({
      fileId: null,
      status: UploadQueueItemStatus.Waiting,
      type: UploadQueueItemType.File,
      key: 'waiting',
    })
    seed(store as never, [finishing, waiting])
    startedUploads.mockClear()

    await store.queueItemProcessed('asset-1', 'file-1')

    // Settling the item must free its slot, or the queue stops moving on the notification path.
    // Freed once: the following read finds the asset with its
    // main file and completes the row, which frees nothing again.
    expect(startedUploads).toHaveBeenCalledTimes(1)
    expect(fetchAsset).toHaveBeenCalledTimes(1)
    expect([finishing.status, finishing.assetStatus]).toEqual([UploadQueueItemStatus.Uploaded, 'with_file'])
    expect(waiting.status).toBe(UploadQueueItemStatus.Uploading)
  })

  it('keeps the warning of an upload whose metadata could not be read, said once the read has failed three times', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1', type: UploadQueueItemType.File, slotName: null })
    seed(store as never, [item])
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))

    await store.queueItemMetadataProcessed('asset-1')
    await store.queueItemMetadataProcessed('asset-1')
    expect(item.error.hasError).toBe(false)
    await store.queueItemMetadataProcessed('asset-1')
    expect(item.error.message).toBe('system.uploadErrors.metadataFailed')

    await store.queueItemProcessed('asset-1', 'file-1')

    // The form stays disabled and the bulk save keeps skipping the row.
    // A row that looks finished but silently is not is worse than one that says so.
    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(item.canEditMetadata).toBe(false)
    expect(item.error.hasError).toBe(true)
    expect(item.error.message).toBe('system.uploadErrors.metadataFailed')
  })

  it('says nothing to a row that already has its metadata', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const loaded = slotItem({
      key: 'loaded',
      fileId: null,
      type: UploadQueueItemType.Asset,
      slotName: null,
      canEditMetadata: true,
    })
    const missing = slotItem({ key: 'missing', fileId: 'file-1', type: UploadQueueItemType.File, slotName: null })
    seed(store as never, [loaded, missing])

    await metadataUnreadable(store)

    expect(missing.error.message).toBe(METADATA_FAILED)
    // No red warning on a working row: it could not be cleared, because
    // the refresh button is offered only to a row without metadata.
    expect(loaded.error.hasError).toBe(false)
  })

  it('takes the warning back once the metadata does arrive', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1', type: UploadQueueItemType.File, slotName: null })
    seed(store as never, [item])
    await metadataUnreadable(store)
    expect([item.error.hasError, item.error.message]).toEqual([true, METADATA_FAILED])
    fetchAsset.mockResolvedValueOnce({
      id: 'asset-1',
      keywords: [],
      authors: [],
      mainFileSingleUse: null,
      metadata: { customData: {}, authorSuggestions: {}, keywordSuggestions: {} },
    })

    await store.queueItemMetadataProcessed('asset-1')

    expect(item.canEditMetadata).toBe(true)
    expect([item.error.hasError, item.error.message]).toEqual([false, ''])
  })

  it('clears the warning the fallback left on an upload with no metadata yet', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({
      fileId: 'file-1',
      type: UploadQueueItemType.File,
      slotName: null,
      canEditMetadata: false,
      status: UploadQueueItemStatus.Processing,
      error: { hasError: true, message: 'Processing is taking too long.', assetFileFailReason: 'none' },
    })
    seed(store as never, [item])

    await store.queueItemProcessed('asset-1', 'file-1')

    expect(item.error.hasError).toBe(false)
  })

  it('clears the warning the fallback left behind', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({
      fileId: 'file-1',
      status: UploadQueueItemStatus.Processing,
      error: { hasError: true, message: 'Processing is taking too long.', assetFileFailReason: 'none' },
    })
    seed(store as never, [item])

    await store.queueItemProcessed('asset-1', 'file-1')

    // The fallback message tells the user to press refresh, and refresh comes back through this path.
    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(item.error.hasError).toBe(false)
  })

  it('marks a duplicate even when the origin file cannot be read', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1' })
    seed(store as never, [item])
    fetchImageFile.mockRejectedValue(new Error('the origin file is gone'))

    await store.queueItemDuplicate('asset-1', 'origin-1', 'image', 'file-1')

    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(item.isDuplicate).toBe(true)
  })
})

describe('a slot upload that fails', () => {
  it('fails only the item holding that file', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const failing = slotItem({ fileId: 'file-1' })
    const other = slotItem({ fileId: 'file-2', slotName: 'image_2' })
    seed(store as never, [failing, other])

    await store.queueItemFailed('asset-1', AssetFileFailReason.InvalidMimeType, 'file-1')

    expect(failing.status).toBe(UploadQueueItemStatus.Failed)
    expect(other.status).toBe(UploadQueueItemStatus.Uploading)
    expect(other.error.hasError).toBe(false)
  })

  it('needs no request of its own to record it', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const failing = slotItem({ fileId: 'file-1' })
    seed(store as never, [failing])

    await store.queueItemFailed('asset-1', AssetFileFailReason.InvalidMimeType, 'file-1')

    expect(fetchAsset).not.toHaveBeenCalled()
    expect(failing.status).toBe(UploadQueueItemStatus.Failed)
  })
})

describe('the upload slots', () => {
  it('starts two and holds the rest back', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    seed(store as never, [
      slotItem({ status: UploadQueueItemStatus.Waiting, type: UploadQueueItemType.File, key: 'a' }),
      slotItem({ status: UploadQueueItemStatus.Waiting, type: UploadQueueItemType.File, key: 'b' }),
      slotItem({ status: UploadQueueItemStatus.Waiting, type: UploadQueueItemType.File, key: 'c' }),
    ])

    store.processUpload(QUEUE)

    expect(startedUploads).toHaveBeenCalledTimes(2)
  })
})

describe('stopping one item', () => {
  it('takes that item out, whatever its position', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const first = slotItem({ fileId: 'file-1', type: UploadQueueItemType.File, key: 'a' })
    const second = slotItem({ fileId: 'file-2', type: UploadQueueItemType.File, key: 'b' })
    seed(store as never, [first, second])

    // Removed by identity: the index of the caller can be stale by the time this runs.
    // Removing nothing left the stopped item in the queue, counted as unfinished and drawn as done.
    await store.stopItemUpload(QUEUE, second as never)

    expect(store.getQueueItems(QUEUE)).toEqual([first])
  })
})

describe('the slot lookup', () => {
  it('answers with the newest upload and its own index', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const finished = slotItem({ fileId: 'file-1', status: UploadQueueItemStatus.Uploaded })
    const current = slotItem({ fileId: 'file-2' })
    seed(store as never, [finished, current])

    // Finished uploads stay in this queue until cleared by hand.
    // Answering with the first match left the newest upload without a progress bar.
    expect(store.getQueueItemForSlotItem(QUEUE, 'image_1', 'asset-1')).toEqual({ item: current, index: 1 })
  })

  it('removes the item it was given, even when it is the first in the queue', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const first = slotItem({ fileId: 'file-1' })
    const second = slotItem({ fileId: 'file-2', slotName: 'image_2' })
    seed(store as never, [first, second])

    await store.stopItemUpload(QUEUE, first as never)

    // The guard must be `> -1`: `> 0` would leave the first item of every queue behind.
    expect(store.getQueueItems(QUEUE)).toEqual([second])
  })

  it('removes the asset it was given, not whatever sits at an index', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const first = slotItem({ fileId: 'file-1', assetId: 'asset-1' })
    const second = slotItem({ fileId: 'file-2', assetId: 'asset-2', slotName: 'image_2' })
    const waiting = slotItem({ fileId: null, assetId: 'asset-3', status: UploadQueueItemStatus.Waiting })
    seed(store as never, [first, second, waiting])

    startedUploads.mockClear()
    await store.removeByAssetId(QUEUE, 'asset-2')

    // The delete is awaited before the row is dropped, so an index held across it can shift.
    expect(store.getQueueItems(QUEUE)).toEqual([first, waiting])
    // Goes through the same teardown as a cancel.
    // The metadata event arrives after the first chunk, so Delete is offered while the upload still runs.
    // A bare splice left it posting chunks to a deleted asset and never refilled the slot.
    expect(second.status).toBe(UploadQueueItemStatus.Stop)
    expect(startedUploads).toHaveBeenCalledTimes(1)
  })

  it('answers with nothing when the slot has no upload', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    seed(store as never, [slotItem({ fileId: 'file-1' })])

    expect(store.getQueueItemForSlotItem(QUEUE, 'image_9', 'asset-1')).toBeUndefined()
  })
})

describe('the metadata of an upload', () => {
  const upload = (over: Record<string, unknown> = {}) =>
    slotItem({ fileId: 'file-1', type: UploadQueueItemType.File, slotName: null, ...over })
  const metadataFromServer = () => ({
    id: 'asset-1',
    keywords: ['from the server'],
    authors: ['from the server'],
    mainFileSingleUse: true,
    metadata: { customData: { title: 'from the server' }, authorSuggestions: {}, keywordSuggestions: {} },
  })

  it('does not make a duplicate editable when its event comes after the duplicate one', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const duplicate = upload({
      key: 'duplicate',
      isDuplicate: true,
      status: UploadQueueItemStatus.Uploaded,
      mainFileSingleUse: false,
    })
    const waiting = upload({ key: 'waiting' })
    seed(store as never, [duplicate, waiting])

    await metadataUnreadable(store)

    expect(waiting.error.message).toBe(METADATA_FAILED)
    expect(duplicate.error.hasError).toBe(false)

    fetchAsset.mockResolvedValueOnce(metadataFromServer())
    await store.queueItemMetadataProcessed('asset-1')

    // The form of a duplicate is disabled for good. If it were editable, it would be validated and saved.
    expect(duplicate.canEditMetadata).toBe(false)
    expect(duplicate.keywords).toEqual([])
    expect(duplicate.mainFileSingleUse).toBe(false)
    expect([waiting.canEditMetadata, waiting.error.hasError]).toEqual([true, false])
  })

  it('is loaded once: a row that has it keeps what the user has typed since', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const edited = upload({ canEditMetadata: true, keywords: ['typed'], customData: { title: 'typed' } })
    const waiting = upload({ key: 'waiting' })
    seed(store as never, [edited, waiting])
    fetchAsset.mockResolvedValueOnce(metadataFromServer())

    await store.queueItemMetadataProcessed('asset-1')

    expect(edited.keywords).toEqual(['typed'])
    expect(edited.customData).toEqual({ title: 'typed' })
    expect(waiting.canEditMetadata).toBe(true)
    expect(waiting.keywords).toEqual(['from the server'])
  })

  it('does not make a failed upload editable again when its event comes after the failure', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const failed = upload({
      key: 'failed',
      status: UploadQueueItemStatus.Failed,
      error: { hasError: true, message: '', assetFileFailReason: 'invalid_mime_type' },
    })
    const waiting = upload({ key: 'waiting' })
    seed(store as never, [failed, waiting])

    await metadataUnreadable(store)

    expect(waiting.error.message).toBe(METADATA_FAILED)
    expect(failed.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_mime_type' })

    fetchAsset.mockResolvedValueOnce(metadataFromServer())
    await store.queueItemMetadataProcessed('asset-1')

    expect(failed.canEditMetadata).toBe(false)
    expect(failed.keywords).toEqual([])
    expect([waiting.canEditMetadata, waiting.error.hasError]).toEqual([true, false])
  })

  // The other order: the server reads metadata off the first
  // chunk, so its event arrives while the file is still sending.
  it('stops being editable when its upload fails after its metadata had come', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const sending = upload({ status: UploadQueueItemStatus.Uploading })
    seed(store as never, [sending])
    runningUpload.fail = undefined
    void store.queueItemUploadStart(sending as never, QUEUE)
    await vi.waitFor(() => expect(runningUpload.fail).toBeDefined())
    fetchAsset.mockResolvedValueOnce(metadataFromServer())
    await store.queueItemMetadataProcessed('asset-1')
    expect(sending.canEditMetadata).toBe(true)

    runningUpload.fail!(new Error('a chunk was refused'))
    await vi.waitFor(() => expect(sending.status).toBe(UploadQueueItemStatus.Failed))

    expect(sending.canEditMetadata).toBe(false)
  })

  it('does not come back to an upload that failed after its metadata could not be read', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const sending = upload({ status: UploadQueueItemStatus.Uploading })
    seed(store as never, [sending])
    runningUpload.fail = undefined
    void store.queueItemUploadStart(sending as never, QUEUE)
    await vi.waitFor(() => expect(runningUpload.fail).toBeDefined())
    await metadataUnreadable(store)
    expect(sending.error.message).toBe(METADATA_FAILED)
    runningUpload.fail!(new Error('a chunk was refused'))
    await vi.waitFor(() => expect(sending.status).toBe(UploadQueueItemStatus.Failed))
    expect(sending.error.message).toBe('the upload failed')
    fetchAsset.mockResolvedValueOnce(metadataFromServer())

    await store.queueItemMetadataProcessed('asset-1')

    expect(sending.canEditMetadata).toBe(false)
    expect(sending.error.message).toBe('the upload failed')
  })

  // The client gave up on a request the server finished.
  // The row comes back with its processed notification.
  it('gets its form back as the user left it when its file turns out to be processed', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const sending = upload({ status: UploadQueueItemStatus.Uploading })
    seed(store as never, [sending])
    runningUpload.fail = undefined
    void store.queueItemUploadStart(sending as never, QUEUE)
    await vi.waitFor(() => expect(runningUpload.fail).toBeDefined())
    fetchAsset.mockResolvedValueOnce(metadataFromServer())
    await store.queueItemMetadataProcessed('asset-1')
    sending.customData = { title: 'typed' }
    runningUpload.fail!(new Error('the answer to the finish request was lost'))
    await vi.waitFor(() => expect(sending.status).toBe(UploadQueueItemStatus.Failed))
    expect(sending.canEditMetadata).toBe(false)

    await store.queueItemProcessed('asset-1', 'file-1')

    expect([sending.status, sending.canEditMetadata]).toEqual([UploadQueueItemStatus.Uploaded, true])
    fetchAsset.mockResolvedValueOnce(metadataFromServer())
    await store.queueItemMetadataProcessed('asset-1')
    expect(sending.customData).toEqual({ title: 'typed' })
  })

  it('gets its form at once, with the metadata it never had, when it had none before the failure', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const sending = upload({ status: UploadQueueItemStatus.Uploading })
    seed(store as never, [sending])
    runningUpload.fail = undefined
    void store.queueItemUploadStart(sending as never, QUEUE)
    await vi.waitFor(() => expect(runningUpload.fail).toBeDefined())
    runningUpload.fail!(new Error('the answer to the finish request was lost'))
    await vi.waitFor(() => expect(sending.status).toBe(UploadQueueItemStatus.Failed))
    fetchAsset.mockResolvedValueOnce({
      ...metadataFromServer(),
      attributes: { assetStatus: 'with_file' },
      mainFile: { id: 'file-1', links: {} },
    })

    await store.queueItemProcessed('asset-1', 'file-1')

    expect([sending.status, sending.canEditMetadata]).toEqual([UploadQueueItemStatus.Uploaded, true])
    expect(sending.customData).toEqual({ title: 'from the server' })
    expect(sending.error.hasError).toBe(false)
  })

  // A duplicate does not get its form back, because its form is disabled for good.
  // A mass-edit row whose file failed does: its status belongs to its
  // batch load, and the processed file restores what the failure took.
  it('does not give the form back to a duplicate, and gives it back to a mass-edit row whose file failed', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const duplicate = upload({ key: 'duplicate', status: UploadQueueItemStatus.Processing })
    const picked = upload({
      key: 'picked',
      fileId: 'file-2',
      type: UploadQueueItemType.Asset,
      status: UploadQueueItemStatus.Uploaded,
    })
    seed(store as never, [duplicate, picked])
    fetchAsset.mockResolvedValueOnce(metadataFromServer())
    await store.queueItemMetadataProcessed('asset-1')
    expect([duplicate.canEditMetadata, picked.canEditMetadata]).toEqual([true, true])
    await store.queueItemDuplicate('asset-1', null, null, 'file-1')
    store.queueItemFailed('asset-1', AssetFileFailReason.Unknown, 'file-2')
    expect([duplicate.canEditMetadata, picked.canEditMetadata]).toEqual([false, false])

    await store.queueItemProcessed('asset-1', 'file-1')
    await store.queueItemProcessed('asset-1', 'file-2')

    expect([duplicate.status, picked.status]).toEqual([UploadQueueItemStatus.Uploaded, UploadQueueItemStatus.Uploaded])
    expect([duplicate.canEditMetadata, picked.canEditMetadata]).toEqual([false, true])
  })

  // The processed notification can arrive before the answer to the finish request.
  it('stays uploaded when the request fails after the notification has settled the row', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const sending = upload({ status: UploadQueueItemStatus.Uploading })
    seed(store as never, [sending])
    runningUpload.fail = undefined
    void store.queueItemUploadStart(sending as never, QUEUE)
    await vi.waitFor(() => expect(runningUpload.fail).toBeDefined())
    await store.queueItemProcessed('asset-1', 'file-1')
    expect(sending.status).toBe(UploadQueueItemStatus.Uploaded)

    runningUpload.fail!(new Error('the answer to the finish request was lost'))
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(sending.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(sending.error.hasError).toBe(false)
  })

  it('still reaches a mass-edit row that failed because its batch load left it out', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    await store.addByAssets(QUEUE, [
      { id: 'asset-1', attributes: { assetType: 'image', assetStatus: 'with_file' }, texts: {}, mainFile: null },
    ] as never)
    const picked = store.getQueueItems(QUEUE)[0]
    await vi.waitFor(() => expect(picked.status).toBe(UploadQueueItemStatus.Failed))
    fetchAsset.mockResolvedValueOnce(metadataFromServer())

    await store.queueItemMetadataProcessed('asset-1')

    expect(picked.canEditMetadata).toBe(true)
    expect(picked.keywords).toEqual(['from the server'])
  })

  it('does not reach a mass-edit row whose file failed', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const picked = upload({
      type: UploadQueueItemType.Asset,
      status: UploadQueueItemStatus.Failed,
      error: { hasError: true, message: '', assetFileFailReason: 'invalid_mime_type' },
    })
    seed(store as never, [picked])
    fetchAsset.mockResolvedValueOnce(metadataFromServer())

    await store.queueItemMetadataProcessed('asset-1')

    expect(picked.canEditMetadata).toBe(false)
  })

  // The form can be enabled before the file is processed, and the switch is one of its fields.
  it('leaves the single-use switch of a row that has its metadata to the user when the file is processed', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const edited = upload({ canEditMetadata: true, mainFileSingleUse: false })
    const waiting = upload({ key: 'waiting', mainFileSingleUse: null })
    seed(store as never, [edited, waiting])
    fetchAsset.mockResolvedValueOnce({
      id: 'asset-1',
      attributes: { assetStatus: 'with_file' },
      mainFile: { id: 'file-1', links: {} },
      mainFileSingleUse: true,
    })

    await store.queueItemProcessed('asset-1', 'file-1')

    expect(edited.mainFileSingleUse).toBe(false)
    expect(waiting.mainFileSingleUse).toBe(true)
  })
})
