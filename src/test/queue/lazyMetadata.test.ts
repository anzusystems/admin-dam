import { UploadQueueItemStatus } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest'

const fetchAssetListByIds = vi.fn(async (): Promise<unknown[]> => [])

vi.mock('@/domains/coreDam/asset/api/assetApi', () => ({
  fetchAsset: vi.fn(),
  fetchAssetListByIds: () => fetchAssetListByIds(),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
// Which asset types have keywords and authors, for the mass operations at the end.
const extSystem = vi.hoisted(() => ({ config: {} as Record<string, unknown> }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigState: () => ({ getDamConfigExtSystem: () => extSystem.config }),
}))
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
    finishAttempted: () => false,
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

const itemsOf = (store: { queues: Record<string, { items: unknown[] }> }) => store.queues[QUEUE].items as QueueRow[]

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

/* An asset that is not described yet, whose file the server is still processing: the processing may fill in its
 * metadata, which a form loaded now would overwrite when saved. Decided by the read of the batch, fresh. */
describe('an asset picked for mass edit whose file the server may still be processing', () => {
  const withFile = (id: string, status: string, described = false) => ({
    ...detail(id),
    keywords: ['keyword-server'],
    flags: { described },
    mainFile: { id: 'file-of-' + id, fileAttributes: { status } },
  })

  it.each(['uploading', 'uploaded', 'stored'])(
    'gets no form, and is told its file is still being processed: %s',
    async (status) => {
      const { useUploadQueuesStore } = await load()
      const store = useUploadQueuesStore()
      fetchAssetListByIds.mockResolvedValue([withFile('asset-1', status)])

      await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
      await vi.waitFor(() => expect(itemsOf(store as never)[0].status).not.toBe(UploadQueueItemStatus.Loading))

      const [picked] = itemsOf(store as never)
      expect([picked.status, picked.canEditMetadata]).toEqual([UploadQueueItemStatus.Failed, false])
      expect(picked.error).toEqual(
        expect.objectContaining({ hasError: true, message: 'system.uploadErrors.assetFileStillProcessing' })
      )
    }
  )

  it('gets its form when the asset is described already, whatever its file', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    fetchAssetListByIds.mockResolvedValue([withFile('asset-1', 'stored', true)])

    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    await vi.waitFor(() => expect(itemsOf(store as never)[0].status).not.toBe(UploadQueueItemStatus.Loading))

    expect([itemsOf(store as never)[0].status, itemsOf(store as never)[0].canEditMetadata]).toEqual([
      UploadQueueItemStatus.Uploaded,
      true,
    ])
  })

  it.each(['processed', 'failed', 'duplicate'])(
    'gets its form when the server is done with its file: %s',
    async (status) => {
      const { useUploadQueuesStore } = await load()
      const store = useUploadQueuesStore()
      fetchAssetListByIds.mockResolvedValue([withFile('asset-1', status)])

      await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
      await vi.waitFor(() => expect(itemsOf(store as never)[0].status).not.toBe(UploadQueueItemStatus.Loading))

      expect([itemsOf(store as never)[0].status, itemsOf(store as never)[0].canEditMetadata]).toEqual([
        UploadQueueItemStatus.Uploaded,
        true,
      ])
    }
  )

  // The metadata notification reaches the row while its batch is on the wire, and its read answers first.
  it('keeps the form the metadata notification gave it before its batch answered that the file is still processed', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    let answerBatch: (assets: unknown[]) => void = () => undefined
    fetchAssetListByIds.mockImplementationOnce(() => new Promise((resolve) => (answerBatch = resolve)))
    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    expect(itemsOf(store as never)[0].status).toBe(UploadQueueItemStatus.Loading)
    const { fetchAsset } = await import('@/domains/coreDam/asset/api/assetApi')
    vi.mocked(fetchAsset).mockResolvedValue({
      ...withFile('asset-1', 'processed'),
      keywords: ['keyword-notified'],
      attributes: { assetType: 'image', assetStatus: 'with_file' },
    } as never)

    vi.useFakeTimers()
    const notified = store.queueItemMetadataProcessed('asset-1')
    await vi.advanceTimersByTimeAsync(5000)
    await notified
    vi.useRealTimers()
    expect(itemsOf(store as never)[0].canEditMetadata).toBe(true)
    // What the batch read before the notification came is older: it does not overwrite what the row has now.
    answerBatch([{ ...withFile('asset-1', 'stored'), keywords: ['keyword-of-the-batch'] }])
    await vi.waitFor(() => expect(itemsOf(store as never)[0].status).not.toBe(UploadQueueItemStatus.Loading))

    const [picked] = itemsOf(store as never) as Array<QueueRow & { keywords: string[] }>
    expect([picked.status, picked.canEditMetadata, picked.keywords]).toEqual([
      UploadQueueItemStatus.Uploaded,
      true,
      ['keyword-notified'],
    ])
    expect([picked.error.hasError, picked.error.message]).toEqual([false, ''])
  })

  /* The same race, and the batch then says the file is processed, leaves the asset out or fails: the row has its form
   * from the notification, and what the user typed into it since. */
  it.each<[string, (answer: (assets: unknown[]) => void, fail: (error: Error) => void) => void]>([
    [
      'answered with the asset',
      (answer) => answer([{ ...withFile('asset-1', 'processed'), keywords: ['keyword-of-the-batch'] }]),
    ],
    ['answered without the asset', (answer) => answer([])],
    ['failed', (_answer, fail) => fail(new Error('the asset service is down'))],
  ])(
    'keeps the form the metadata notification gave it, and what was typed into it, when its batch then %s',
    async (_how, endBatch) => {
      vi.useFakeTimers()
      onTestFinished(() => void vi.useRealTimers())
      const { useUploadQueuesStore } = await load()
      const store = useUploadQueuesStore()
      let answerBatch: (assets: unknown[]) => void = () => undefined
      let failBatch: (error: Error) => void = () => undefined
      fetchAssetListByIds.mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            answerBatch = resolve
            failBatch = reject
          })
      )
      await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
      const { fetchAsset } = await import('@/domains/coreDam/asset/api/assetApi')
      vi.mocked(fetchAsset).mockResolvedValue({
        ...withFile('asset-1', 'processed'),
        keywords: ['keyword-notified'],
        attributes: { assetType: 'image', assetStatus: 'with_file' },
      } as never)
      const notified = store.queueItemMetadataProcessed('asset-1')
      await vi.advanceTimersByTimeAsync(5000)
      await notified
      const [row] = itemsOf(store as never) as Array<QueueRow & { keywords: string[] }>
      expect([row.status, row.canEditMetadata]).toEqual([UploadQueueItemStatus.Loading, true])
      row.keywords = ['keyword-typed']

      endBatch(answerBatch, failBatch)
      await vi.advanceTimersByTimeAsync(0)

      expect([row.status, row.canEditMetadata, row.keywords]).toEqual([
        UploadQueueItemStatus.Uploaded,
        true,
        ['keyword-typed'],
      ])
      expect([row.error.hasError, row.error.message]).toEqual([false, ''])
    }
  )

  // Nothing typed into it either: the batch was sent before the read of the notification, so its answer is the older.
  it('keeps what the metadata notification read when its batch, sent before that, answers with the asset after it', async () => {
    vi.useFakeTimers()
    onTestFinished(() => void vi.useRealTimers())
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    let answerBatch: (assets: unknown[]) => void = () => undefined
    fetchAssetListByIds.mockImplementationOnce(() => new Promise((resolve) => (answerBatch = resolve)))
    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    const { fetchAsset } = await import('@/domains/coreDam/asset/api/assetApi')
    vi.mocked(fetchAsset).mockResolvedValue({
      ...withFile('asset-1', 'processed'),
      keywords: ['keyword-notified'],
      attributes: { assetType: 'image', assetStatus: 'with_file' },
    } as never)
    const notified = store.queueItemMetadataProcessed('asset-1')
    await vi.advanceTimersByTimeAsync(5000)
    await notified
    const [row] = itemsOf(store as never) as Array<QueueRow & { keywords: string[] }>
    expect([row.canEditMetadata, row.keywords]).toEqual([true, ['keyword-notified']])

    answerBatch([{ ...withFile('asset-1', 'processed'), keywords: ['keyword-of-the-batch'] }])
    await vi.advanceTimersByTimeAsync(0)

    expect([row.status, row.canEditMetadata, row.keywords]).toEqual([
      UploadQueueItemStatus.Uploaded,
      true,
      ['keyword-notified'],
    ])
  })

  // Taken out and picked again while the first batch is on the wire: the second batch answers first, and stands.
  it('keeps what a newer batch gave it when an older one answers after, that the file is still processed', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    let answerOlder: (assets: unknown[]) => void = () => undefined
    fetchAssetListByIds.mockImplementationOnce(() => new Promise((resolve) => (answerOlder = resolve)))
    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    await store.removeByAssetId(QUEUE, 'asset-1')
    fetchAssetListByIds.mockResolvedValueOnce([withFile('asset-1', 'processed')])
    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    await vi.waitFor(() => expect(itemsOf(store as never)[0].status).toBe(UploadQueueItemStatus.Uploaded))

    answerOlder([withFile('asset-1', 'stored')])
    await new Promise((resolve) => setTimeout(resolve, 0))

    const [picked] = itemsOf(store as never)
    expect([picked.status, picked.canEditMetadata]).toEqual([UploadQueueItemStatus.Uploaded, true])
    expect([picked.error.hasError, picked.error.message]).toEqual([false, ''])
  })

  // The newer batch left it out: the row has its text and no form, and the older answer says nothing new of it.
  it('keeps what a newer batch that left it out said when an older one answers after, that the file is still processed', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    let answerOlder: (assets: unknown[]) => void = () => undefined
    fetchAssetListByIds.mockImplementationOnce(() => new Promise((resolve) => (answerOlder = resolve)))
    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    await store.removeByAssetId(QUEUE, 'asset-1')
    fetchAssetListByIds.mockResolvedValueOnce([])
    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    await vi.waitFor(() => expect(itemsOf(store as never)[0].status).toBe(UploadQueueItemStatus.Failed))

    answerOlder([withFile('asset-1', 'stored')])
    await new Promise((resolve) => setTimeout(resolve, 0))

    const [picked] = itemsOf(store as never)
    expect([picked.status, picked.canEditMetadata]).toEqual([UploadQueueItemStatus.Failed, false])
    expect(picked.error.message).toBe('system.uploadErrors.metadataUnavailable')
  })

  // The one who uploaded the asset is told when its metadata is processed, and the row comes alive.
  it('gets its metadata and its form from the metadata notification, and loses the text', async () => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    fetchAssetListByIds.mockResolvedValue([withFile('asset-1', 'stored')])
    await store.addByAssets(QUEUE, [listedAsset('asset-1')] as never)
    await vi.waitFor(() => expect(itemsOf(store as never)[0].status).toBe(UploadQueueItemStatus.Failed))
    const { fetchAsset } = await import('@/domains/coreDam/asset/api/assetApi')
    vi.mocked(fetchAsset).mockResolvedValue({
      ...withFile('asset-1', 'processed'),
      attributes: { assetType: 'image', assetStatus: 'with_file' },
    } as never)

    vi.useFakeTimers()
    const notified = store.queueItemMetadataProcessed('asset-1')
    await vi.advanceTimersByTimeAsync(5000)
    await notified
    vi.useRealTimers()

    const [picked] = itemsOf(store as never) as Array<QueueRow & { keywords: string[] }>
    expect([picked.status, picked.canEditMetadata, picked.keywords]).toEqual([
      UploadQueueItemStatus.Uploaded,
      true,
      ['keyword-server'],
    ])
    expect([picked.error.hasError, picked.error.message]).toEqual([false, ''])
  })
})

describe('mass operations: filling a custom value into the queue', () => {
  const fill = async (customData: Record<string, unknown>[], forceReplace = false) => {
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const items = customData.map((one) => ({ assetType: 'image', customData: one }))
    ;(store.queues as Record<string, unknown>)[QUEUE] = { items }
    store.queueItemsReplaceEmptyCustomDataValue(
      QUEUE,
      { assetType: 'image', elementProperty: 'title', value: 'filled' } as never,
      forceReplace
    )

    return (store.queues[QUEUE].items as unknown as typeof items).map((item) => item.customData.title)
  }

  // `null` is a value that was emptied, as a cleared number and as the API returns it.
  it('fills what is empty: never set, an empty text, null, or an empty list', async () => {
    expect(await fill([{}, { title: '' }, { title: null }, { title: [] }])).toEqual([
      'filled',
      'filled',
      'filled',
      'filled',
    ])
  })

  it('keeps a value that is there, zero and false included, unless told to replace', async () => {
    expect(await fill([{ title: 'kept' }, { title: 0 }, { title: false }, { title: ['kept'] }])).toEqual([
      'kept',
      0,
      false,
      ['kept'],
    ])
    expect(await fill([{ title: 'kept' }], true)).toEqual(['filled'])
  })
})

// The rows show keywords and authors only where the ext system has them on for the asset type.
describe('mass operations: filling keywords and authors into the queue', () => {
  const fill = async (forceReplace = false) => {
    extSystem.config = {
      image: { keywords: { enabled: true }, authors: { enabled: false } },
      document: { keywords: { enabled: false }, authors: { enabled: true } },
    }
    const { useUploadQueuesStore } = await load()
    const store = useUploadQueuesStore()
    const items = ['image', 'document', 'video'].map((assetType) => ({
      assetType,
      keywords: [] as string[],
      authors: [] as string[],
    }))
    ;(store.queues as Record<string, unknown>)[QUEUE] = { items }
    store.queueItemsReplaceEmptyKeywords(QUEUE, ['keyword'], forceReplace)
    store.queueItemsReplaceEmptyAuthors(QUEUE, ['author'], forceReplace)

    return (store.queues[QUEUE].items as unknown as typeof items).map((item) => [item.keywords, item.authors])
  }

  // A document got the keywords typed for the images: its row has no input for them, and the bulk save sent them.
  it('writes them only into the items whose asset type has them enabled', async () => {
    const written = [
      [['keyword'], []],
      [[], ['author']],
      [[], []],
    ]
    expect(await fill()).toEqual(written)
    expect(await fill(true)).toEqual(written)
  })
})
