import { DamAssetType, UploadQueueItemStatus } from '@anzusystems/common-admin'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchAsset = vi.fn(async (): Promise<unknown> => undefined)
const finishMocks = {
  [DamAssetType.Image]: vi.fn(async (): Promise<unknown> => ({ id: 'file-1' })),
  [DamAssetType.Audio]: vi.fn(async (): Promise<unknown> => ({ id: 'file-1' })),
  [DamAssetType.Video]: vi.fn(async (): Promise<unknown> => ({ id: 'file-1' })),
  [DamAssetType.Document]: vi.fn(async (): Promise<unknown> => ({ id: 'file-1' })),
}
const queueItemProcessed = vi.fn()
const queueItemMetadataProcessed = vi.fn()
const queueItemFailed = vi.fn()
const queueItemDuplicate = vi.fn()

vi.mock('@/domains/coreDam/asset/api/assetApi', () => ({ fetchAsset: () => fetchAsset() }))
vi.mock('@/domains/coreDam/asset/api/imageApi', () => ({
  uploadFinish: () => finishMocks.image(),
}))
vi.mock('@/domains/coreDam/asset/api/audioApi', () => ({
  uploadFinish: () => finishMocks.audio(),
}))
vi.mock('@/domains/coreDam/asset/api/videoApi', () => ({
  uploadFinish: () => finishMocks.video(),
}))
vi.mock('@/domains/coreDam/asset/api/documentApi', () => ({
  uploadFinish: () => finishMocks.document(),
}))
vi.mock('@/domains/coreDam/asset/store/uploadQueuesStore', () => ({
  useUploadQueuesStore: () => ({
    queueItemProcessed,
    queueItemMetadataProcessed,
    queueItemFailed,
    queueItemDuplicate,
  }),
}))

const queueItem = (over: Record<string, unknown> = {}) => ({
  type: 'slotFile',
  assetId: 'asset-1',
  fileId: 'file-main',
  assetType: 'image',
  status: UploadQueueItemStatus.Uploading as string,
  notificationFallbackTimer: undefined,
  notificationFallbackTry: 1,
  error: { hasError: false, message: '' },
  ...over,
})

const processedAsset = (mainFileId: string) => ({
  id: 'asset-1',
  mainFile: { id: mainFileId, fileAttributes: { status: 'processed', failReason: 'none' } },
})

const load = async (fallbackEnabled = true) => {
  vi.resetModules()
  const { envConfig } = await import('@/shared/EnvConfigService')
  envConfig.uploadStatusFallback = fallbackEnabled

  return await import('@/domains/coreDam/asset/api/fileApi')
}

beforeEach(() => {
  vi.clearAllMocks()
  Object.values(finishMocks).forEach((mock) => mock.mockResolvedValue({ id: 'file-1' }))
})

// Every asset type goes through the same finish branch, and every one of them can be beaten to it.
describe.each(Object.values(DamAssetType))('the finish response for %s', (assetType) => {
  it('leaves an item the notification has already settled alone', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load()
    const item = queueItem({ assetType })
    // The websocket event can beat the response to the finish request.
    finishMocks[assetType].mockImplementation(async () => {
      item.status = UploadQueueItemStatus.Uploaded

      return { id: 'file-1' }
    })
    fetchAsset.mockResolvedValue(processedAsset('file-main'))

    await uploadFinish(item as never, 'sha')
    await vi.advanceTimersByTimeAsync(60_000)
    vi.useRealTimers()

    // `Processing` written over it waits for a notification that has already been and gone.
    expect(item.status).toBe(UploadQueueItemStatus.Uploaded)
    expect(fetchAsset).not.toHaveBeenCalled()
  })

  it('arms no fallback for an upload the user stopped while it was finishing', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load()
    const item = queueItem({ assetType })
    finishMocks[assetType].mockImplementation(async () => {
      item.status = UploadQueueItemStatus.Stop

      return { id: 'file-1' }
    })

    await uploadFinish(item as never, 'sha')
    await vi.advanceTimersByTimeAsync(60_000)
    vi.useRealTimers()

    // The item has left the queue; a timer on it would poll for something nobody is watching.
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(item.status).toBe(UploadQueueItemStatus.Stop)
  })

  it('hands an untouched item over to processing', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load()
    const item = queueItem({ assetType })
    fetchAsset.mockResolvedValue(processedAsset('file-main'))

    await uploadFinish(item as never, 'sha')
    expect(item.status).toBe(UploadQueueItemStatus.Processing)
    await vi.advanceTimersByTimeAsync(20_000)
    vi.useRealTimers()

    expect(queueItemProcessed).toHaveBeenCalledWith('asset-1', 'file-main')
  })
})

describe('the notification fallback', () => {
  it('is not armed at all where the deployment has it switched off', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load(false)
    const item = queueItem()
    fetchAsset.mockResolvedValue(processedAsset('file-main'))

    await uploadFinish(item as never, 'sha')
    await vi.advanceTimersByTimeAsync(300_000)
    vi.useRealTimers()

    // The flag is what a deployment turns off when it trusts its notifications; polling anyway would put the whole
    // queue back on the asset endpoint behind its back.
    expect(fetchAsset).not.toHaveBeenCalled()
    expect(item.status).toBe(UploadQueueItemStatus.Processing)
  })

  it('is armed for an external import even where the deployment has it switched off', async () => {
    vi.useFakeTimers()
    const { armNotificationFallback } = await load(false)
    const item = queueItem({ status: UploadQueueItemStatus.Processing })
    fetchAsset.mockResolvedValue(processedAsset('file-main'))

    armNotificationFallback(item as never)
    await vi.advanceTimersByTimeAsync(20_000)
    vi.useRealTimers()

    // An import has no upload whose finish would arm one, and its notification can arrive before the import responds
    // - so with nothing armed a lost event leaves it processing for ever, setting or no setting.
    expect(queueItemProcessed).toHaveBeenCalledWith('asset-1', 'file-main')
  })

  it('says nothing about a slot upload, whose file is not the main one', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load()
    const item = queueItem({ fileId: 'file-slot' })
    fetchAsset.mockResolvedValue(processedAsset('file-main'))

    await uploadFinish(item as never, 'sha')
    await vi.advanceTimersByTimeAsync(20_000)
    vi.useRealTimers()

    // The main file being processed says nothing about a slot: reading it anyway used to mark a slot finished while
    // its own file was still being worked on.
    expect(queueItemProcessed).not.toHaveBeenCalled()
  })

  it('keeps trying after a request that failed', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load()
    const item = queueItem()
    fetchAsset.mockRejectedValueOnce(new Error('the asset service is down'))
    fetchAsset.mockResolvedValue(processedAsset('file-main'))

    await uploadFinish(item as never, 'sha')
    await vi.advanceTimersByTimeAsync(60_000)
    vi.useRealTimers()

    // One failure used to end the chain for good, leaving the item processing for ever.
    expect(fetchAsset.mock.calls.length).toBeGreaterThan(1)
    expect(queueItemProcessed).toHaveBeenCalledWith('asset-1', 'file-main')
  })

  it('stops when the item is cleared while its own request is on the wire', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load()
    const item = queueItem({ fileId: 'file-slot' })
    fetchAsset.mockImplementation(async () => {
      // The queue is cleared, or the item stopped, while this request is out.
      item.status = UploadQueueItemStatus.Stop

      return processedAsset('file-main')
    })

    await uploadFinish(item as never, 'sha')
    await vi.advanceTimersByTimeAsync(20_000)
    const callsAfterFirstAttempt = fetchAsset.mock.calls.length
    await vi.advanceTimersByTimeAsync(300_000)
    vi.useRealTimers()

    // Asked only before the request, the chain counted the attempt and set the next timer anyway - and every one of
    // those woke up only to find the item settled and return.
    expect(callsAfterFirstAttempt).toBe(1)
    expect(item.notificationFallbackTry).toBe(1)
  })

  it('gives up out loud rather than in silence', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load()
    const item = queueItem({ fileId: 'file-slot' })
    fetchAsset.mockResolvedValue(processedAsset('file-main'))

    await uploadFinish(item as never, 'sha')
    // Read at 10, 50, 140 and 300 seconds; the next timer, at 550, is the one that gives up.
    await vi.advanceTimersByTimeAsync(300_000)
    expect(fetchAsset).toHaveBeenCalledTimes(4)
    expect(item.error.hasError).toBe(false)
    await vi.advanceTimersByTimeAsync(250_000)
    vi.useRealTimers()

    // Returning without a word left the row spinning with nothing to explain it. A slot row has
    // only Cancel, so it must not be sent looking for the refresh button the other row has.
    expect(item.error.hasError).toBe(true)
    expect(item.error.message).toBe('system.uploadErrors.processingTooLongSlot')
  })

  it('stops polling as soon as the item is cancelled', async () => {
    vi.useFakeTimers()
    const { uploadFinish } = await load()
    const item = queueItem({ fileId: 'file-slot' })
    fetchAsset.mockResolvedValue(processedAsset('file-main'))

    await uploadFinish(item as never, 'sha')
    // One attempt has run; the user cancels before the chain has exhausted itself.
    await vi.advanceTimersByTimeAsync(20_000)
    const callsBeforeStop = fetchAsset.mock.calls.length
    expect(callsBeforeStop).toBeGreaterThan(0)
    item.status = UploadQueueItemStatus.Stop

    await vi.advanceTimersByTimeAsync(300_000)
    vi.useRealTimers()

    // Checking only for `Uploaded` kept it polling for an item the user had already stopped.
    expect(fetchAsset.mock.calls.length).toBe(callsBeforeStop)
  })
})

// With no notification there is no metadata one either, and the poll is all an item will hear.
describe('what the notification fallback settles an item with', () => {
  const settle = async (item: ReturnType<typeof queueItem>, asset: unknown) => {
    vi.useFakeTimers()
    const { armNotificationFallback } = await load()
    fetchAsset.mockResolvedValue(asset)

    armNotificationFallback(item as never)
    await vi.advanceTimersByTimeAsync(20_000)
    vi.useRealTimers()
  }
  const processing = (over: Record<string, unknown> = {}) =>
    queueItem({ type: 'file', status: UploadQueueItemStatus.Processing, canEditMetadata: false, ...over })

  it('loads the metadata of a processed upload, which is what enables its form', async () => {
    await settle(processing(), processedAsset('file-main'))

    expect(queueItemProcessed).toHaveBeenCalledWith('asset-1', 'file-main')
    expect(queueItemMetadataProcessed).toHaveBeenCalledWith('asset-1')
  })

  it('asks for no metadata where the item already has it, nor on a slot upload', async () => {
    // Nothing to load: the store leaves a row that has its metadata alone.
    await settle(processing({ canEditMetadata: true }), processedAsset('file-main'))
    // A slot row has no metadata form.
    await settle(processing({ type: 'slotFile' }), processedAsset('file-main'))

    expect(queueItemProcessed).toHaveBeenCalledTimes(2)
    expect(queueItemMetadataProcessed).not.toHaveBeenCalled()
  })

  it('tells a duplicate which file it duplicates', async () => {
    await settle(processing(), {
      id: 'asset-1',
      attributes: { assetType: 'image' },
      mainFile: {
        id: 'file-main',
        originAssetFile: 'file-origin',
        fileAttributes: { status: 'duplicate', failReason: 'none' },
      },
    })

    // Without it the row says "duplicate" and has no link to the original, and nothing adds one later.
    expect(queueItemDuplicate).toHaveBeenCalledWith('asset-1', 'file-origin', 'image', 'file-main')
  })
})
