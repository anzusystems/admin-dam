import { AssetFileFailReason, UploadQueueItemStatus, UploadQueueItemType } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchAsset = vi.fn(async (): Promise<unknown> => ({
  id: 'asset-1',
  attributes: { assetStatus: 'with_file' },
  mainFile: { id: 'file-1', links: {} },
  mainFileSingleUse: null,
}))

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
  // Never settling, unless a test fails it while it sends: an upload that resolves at once sends `processUpload`
  // straight back into the waiting item it just started, and the loop never ends.
  useUpload: () => {
    startedUploads()

    return {
      // The chunks and the finish request.
      upload: () => new Promise((_resolve, reject) => (runningUpload.fail = reject)),
      uploadInit: () => Promise.resolve(),
      stop: vi.fn(),
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

beforeEach(() => {
  vi.clearAllMocks()
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
    // They share the asset and differ only in the file, so without the file the first result
    // marked the second one finished too.
    expect(other.status).toBe(UploadQueueItemStatus.Uploading)
  })

  it('leaves a queued upload alone until it has a file of its own', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const uploading = slotItem({ fileId: 'file-1' })
    // Only two run at a time, so a third waits with no `fileId` — matching it on the asset alone
    // marked a slot finished whose file had never been sent.
    const waiting = slotItem({ fileId: null, status: UploadQueueItemStatus.Waiting, slotName: 'image_3' })
    seed(store as never, [uploading, waiting])

    await store.queueItemProcessed('asset-1', 'file-1')

    expect(waiting.status).toBe(UploadQueueItemStatus.Waiting)
  })

  it('leaves a queued upload alone when the refresh knows no file either', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // The refresh button carries no file id, and a queued slot has none yet - two nulls are not a
    // match, they are two things nobody knows.
    const waiting = slotItem({ fileId: null, status: UploadQueueItemStatus.Waiting })
    seed(store as never, [waiting])

    await store.queueItemProcessed('asset-1')

    expect(waiting.status).toBe(UploadQueueItemStatus.Waiting)
  })

  it('brings an asset picked for mass edit up to date without settling it', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // Added by asset, not uploaded: there is no file to match the event on, only the asset.
    // The switch as the user has just set it in the mass edit form; the server still says `null`.
    const item = slotItem({
      fileId: null,
      type: UploadQueueItemType.Asset,
      slotName: null,
      mainFileSingleUse: true,
    })
    seed(store as never, [item])

    await store.queueItemProcessed('asset-1', 'file-1')

    // The status of such a row belongs to the batch load that put it there; the event brings the asset status and the
    // preview, and settling one the batch had failed would have left it looking finished with the failure still
    // written on it.
    expect(item.assetStatus).toBe('with_file')
    expect(item.status).toBe(UploadQueueItemStatus.Uploading)
    // And the form field is the form's, not the server's.
    expect(item.mainFileSingleUse).toBe(true)
  })

  it('does not fail an asset picked for mass edit on a file of somebody else', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // Picked before it had a main file, so it carries no file id of its own.
    const massEdit = slotItem({
      fileId: null,
      type: UploadQueueItemType.Asset,
      slotName: null,
      status: UploadQueueItemStatus.Uploaded,
    })
    seed(store as never, [massEdit])

    store.queueItemFailed('asset-1', AssetFileFailReason.Unknown, 'file-9')

    // A slot upload into the same asset at the same moment would otherwise fail a row that is doing fine - the event
    // does not say whether its file is the asset's main one.
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

    // Two at a time, counting the ones already running: starting two regardless of them is what pushed the number up
    // under a long queue.
    expect(startedUploads).toHaveBeenCalledTimes(1)
  })

  it('leaves an asset picked for mass edit alone while the batch load still owns it', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // Added by asset a moment ago; its metadata batch is still on the wire. The one that already
    // has a main file takes the same route as an ordinary upload, so both have to be covered.
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

    // Taking it off `Loading` here makes the batch's own failure handler pass it by, and the row then looks finished
    // with no metadata behind it - which the bulk save skips without a word.
    expect(loading.status).toBe(UploadQueueItemStatus.Loading)
    expect(loadingWithFile.status).toBe(UploadQueueItemStatus.Loading)
  })

  it('still settles an ordinary upload on the asset alone', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // Not a slot: the manual refresh knows only the asset.
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

    // An asset carries many slots, and a refresh of the asset says nothing about which of them finished - letting it
    // through would mark a slot done on somebody else's news.
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

    // The event is what says the file is done; the fetch only decorates the row.
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

    // Gating the transition on `asset.mainFile` left a draft asset's upload running for ever.
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

    // Settling the item has to free its slot, or the queue stops moving on the notification path.
    expect(startedUploads).toHaveBeenCalledTimes(1)
  })

  it('keeps the warning of an upload whose metadata could not be read', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1', type: UploadQueueItemType.File, slotName: null })
    seed(store as never, [item])
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))

    await store.queueItemMetadataProcessed('asset-1')
    await store.queueItemProcessed('asset-1', 'file-1')

    // The form is still disabled and the bulk save still skips it - a row that looks finished and silently is not is
    // worse than one that says so.
    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(item.canEditMetadata).toBe(false)
    expect(item.error.hasError).toBe(true)
  })

  it('says nothing to a row that already has its metadata', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // Picked for mass edit: the batch load gave it its metadata already.
    const loaded = slotItem({ fileId: null, type: UploadQueueItemType.Asset, slotName: null, canEditMetadata: true })
    seed(store as never, [loaded])
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))

    await store.queueItemMetadataProcessed('asset-1')

    // A red warning on a working row, and one it could not take back: the refresh button is only offered to a row
    // without metadata.
    expect(loaded.error.hasError).toBe(false)
  })

  it('takes the warning back once the metadata does arrive', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const item = slotItem({ fileId: 'file-1', type: UploadQueueItemType.File, slotName: null })
    seed(store as never, [item])
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))

    await store.queueItemMetadataProcessed('asset-1')
    fetchAsset.mockResolvedValue({
      id: 'asset-1',
      keywords: [],
      authors: [],
      mainFileSingleUse: null,
      metadata: { customData: {}, authorSuggestions: {}, keywordSuggestions: {} },
    })
    await store.queueItemMetadataProcessed('asset-1')

    // Refresh does exactly this, and so does the fallback when it finds the file processed.
    expect(item.canEditMetadata).toBe(true)
    expect(item.error.hasError).toBe(false)
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

    // The user did what the message told them to, so the warning has to go.
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

    // The fallback message tells the user to press refresh, and refresh comes back through here.
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

    // The event is what says it is a duplicate; the origin file only decorates the row.
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
    // One slot failing says nothing about the other; they share only the asset.
    expect(other.status).toBe(UploadQueueItemStatus.Uploading)
    expect(other.error.hasError).toBe(false)
  })

  it('needs no request of its own to record it', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const failing = slotItem({ fileId: 'file-1' })
    seed(store as never, [failing])

    await store.queueItemFailed('asset-1', AssetFileFailReason.InvalidMimeType, 'file-1')

    // The event carries everything this needs.
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

    // Two at a time, the whole point of the queue; nothing in the suite pinned the number itself.
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

    // Removed by identity: the caller's index can be stale by the time this runs, and removing nothing left the
    // stopped item in the queue - counted as unfinished, drawn as done.
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

    // Finished uploads stay in this queue until it is cleared by hand, so answering with the first match left the
    // newest upload with no progress bar.
    expect(store.getQueueItemForSlotItem(QUEUE, 'image_1', 'asset-1')).toEqual({ item: current, index: 1 })
  })

  it('removes the item it was given, even when it is the first in the queue', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const first = slotItem({ fileId: 'file-1' })
    const second = slotItem({ fileId: 'file-2', slotName: 'image_2' })
    seed(store as never, [first, second])

    await store.stopItemUpload(QUEUE, first as never)

    // The guard has to be `> -1`: `> 0` would leave the first item of every queue behind.
    expect(store.getQueueItems(QUEUE)).toEqual([second])
  })

  it('removes the asset it was given, not whatever sits at an index', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const first = slotItem({ fileId: 'file-1', assetId: 'asset-1' })
    const second = slotItem({ fileId: 'file-2', assetId: 'asset-2', slotName: 'image_2' })
    // Only two run at a time, so this one is waiting for the slot the removal frees.
    const waiting = slotItem({ fileId: null, assetId: 'asset-3', status: UploadQueueItemStatus.Waiting })
    seed(store as never, [first, second, waiting])

    startedUploads.mockClear()
    await store.removeByAssetId(QUEUE, 'asset-2')

    // The delete is awaited before the row is dropped, so an index held across it can shift.
    expect(store.getQueueItems(QUEUE)).toEqual([first, waiting])
    // And through the same teardown as a cancel: the metadata event arrives after the first chunk, so Delete is
    // offered while the upload is still running, and a bare splice left it posting chunks to an asset the server had
    // just deleted with its slot never refilled.
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
    const duplicate = upload({ isDuplicate: true, status: UploadQueueItemStatus.Uploaded, mainFileSingleUse: false })
    seed(store as never, [duplicate])
    fetchAsset.mockResolvedValueOnce(metadataFromServer())

    await store.queueItemMetadataProcessed('asset-1')

    // Its form is disabled for good; editable, it was validated and saved all the same.
    expect(duplicate.canEditMetadata).toBe(false)
    expect(duplicate.keywords).toEqual([])
    // What the duplicate handler took from the original file stays.
    expect(duplicate.mainFileSingleUse).toBe(false)

    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))
    await store.queueItemMetadataProcessed('asset-1')

    // And it misses nothing when that metadata cannot be read.
    expect(duplicate.error.hasError).toBe(false)
  })

  // Whoever asks: the notification, the fallback or the refresh button. Their answers can come in either order.
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
      status: UploadQueueItemStatus.Failed,
      error: { hasError: true, message: '', assetFileFailReason: 'invalid_mime_type' },
    })
    seed(store as never, [failed])
    fetchAsset.mockResolvedValueOnce(metadataFromServer())

    await store.queueItemMetadataProcessed('asset-1')

    // Editable, it was validated and saved with the rest of the queue.
    expect(failed.canEditMetadata).toBe(false)
    expect(failed.keywords).toEqual([])

    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))
    await store.queueItemMetadataProcessed('asset-1')

    // And its fail reason is not replaced by a message about metadata.
    expect(failed.error.message).toBe('')
  })

  // The other order: the server reads the metadata off the first chunk, so its event comes while the file sends.
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

    // Editable, it was validated and saved with the rest of the queue.
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
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))
    await store.queueItemMetadataProcessed('asset-1')
    runningUpload.fail!(new Error('a chunk was refused'))
    await vi.waitFor(() => expect(sending.status).toBe(UploadQueueItemStatus.Failed))
    fetchAsset.mockResolvedValueOnce(metadataFromServer())

    await store.queueItemMetadataProcessed('asset-1')

    // What is wrong with the row now is its file, and the message says so.
    expect(sending.canEditMetadata).toBe(false)
    expect(sending.error.message).toBe('the upload failed')
  })

  // The client gave up on a request the server finished: the row comes back with its processed notification.
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
    // And a refresh after it is a request for nothing: the metadata is loaded once.
    fetchAsset.mockResolvedValueOnce(metadataFromServer())
    await store.queueItemMetadataProcessed('asset-1')
    expect(sending.customData).toEqual({ title: 'typed' })
  })

  // One that had no metadata yet has no form to get back: refresh, or the fallback, loads it.
  it('stays without its form when it had no metadata before the failure, until that is loaded', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const sending = upload({ status: UploadQueueItemStatus.Uploading })
    seed(store as never, [sending])
    runningUpload.fail = undefined
    void store.queueItemUploadStart(sending as never, QUEUE)
    await vi.waitFor(() => expect(runningUpload.fail).toBeDefined())
    runningUpload.fail!(new Error('the answer to the finish request was lost'))
    await vi.waitFor(() => expect(sending.status).toBe(UploadQueueItemStatus.Failed))

    await store.queueItemProcessed('asset-1', 'file-1')
    expect([sending.status, sending.canEditMetadata]).toEqual([UploadQueueItemStatus.Uploaded, false])

    fetchAsset.mockResolvedValueOnce(metadataFromServer())
    await store.queueItemMetadataProcessed('asset-1')
    expect(sending.canEditMetadata).toBe(true)
    expect(sending.customData).toEqual({ title: 'from the server' })
  })

  // Nor does a duplicate get it back, whose form is disabled for good, or a mass-edit row whose file failed: the
  // processed notification leaves the status of such a row alone, and a failed row has no form.
  it('does not give the form back to a duplicate, nor to a mass-edit row whose file failed', async () => {
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

    expect([duplicate.status, picked.status]).toEqual([UploadQueueItemStatus.Uploaded, UploadQueueItemStatus.Failed])
    expect([duplicate.canEditMetadata, picked.canEditMetadata]).toEqual([false, false])
  })

  // The processed notification can beat the answer to the finish request.
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

  // The one failed row it still reaches: it failed for want of this very metadata.
  it('still reaches a mass-edit row that failed because its batch load left it out', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    // The mocked batch load answers with no asset at all.
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
