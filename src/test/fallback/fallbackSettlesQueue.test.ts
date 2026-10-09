import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  assetDetail,
  assetFile,
  createFakeDam,
  queueRow,
  seedDamConfig,
  seedQueue,
  stubFileReader,
} from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* The poll and the store together, with nothing between them replaced: only the server is a fake, and no
 * notification is ever delivered. What is asserted is what the app asked the server and what the row holds
 * afterwards - not when it asked, nor through which function. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  useCurrentAssetLicence: () => ({ currentAssetLicenceId: { value: 1 } }),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/domains/coreDam/asset/composables/externalProviders', () => ({
  useExternalProviders: () => ({ activeExternalProvider: { value: 'unsplash' } }),
}))
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))

const QUEUE = 'global'
// Far enough for one read of the poll, whatever its rhythm.
const ONE_READ = 20_000
const A_LONG_TIME = 30 * 60_000

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore())
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

  return useUploadQueuesStore()
}

type Store = Awaited<ReturnType<typeof load>>

const waitingUpload = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({
    status: 'waiting',
    assetId: null,
    fileId: null,
    file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
    displayTitle: 'photo.jpg',
    ...over,
  })

/** Starts what waits in the queue and lets the requests of the upload answer: the row is handed over to processing. */
const uploadToProcessing = async (store: Store, rows: UploadQueueItem[]) => {
  const seeded = seedQueue(store, QUEUE, rows)
  store.processUpload(QUEUE)
  await vi.advanceTimersByTimeAsync(0)
  seeded.forEach((row) => expect(row.status).toBe('processing'))

  return seeded
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  stubFileReader()
  server = createFakeDam()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('an upload no notification comes for', () => {
  it('is settled by a read of its asset: uploaded, with its metadata and its form', async () => {
    const store = await load()
    const [row] = await uploadToProcessing(store, [waitingUpload()])
    expect([row.assetId, row.fileId]).toEqual(['asset-1', 'file-1'])
    expect(server.assetReads('asset-1')).toBe(0)
    server.asset(
      assetDetail('asset-1', {
        mainFile: assetFile('file-1', 'processed', { asset: 'asset-1' }),
        mainFileSingleUse: true,
        metadata: {
          customData: { title: 'from the server' },
          authorSuggestions: { 'New Author': {}, 'Known Author': ['author-a', 'author-b'] },
          keywordSuggestions: { 'new keyword': {} },
        },
      })
    )

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(server.assetReads('asset-1')).toBeGreaterThan(0)
    expect(row.status).toBe('uploaded')
    expect(row.isDuplicate).toBe(false)
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
    // What the read gives the row: the state of the asset, the preview of its main file ...
    expect(row.assetStatus).toBe('with_file')
    expect(row.imagePreview).toEqual({ url: 'https://dam.test/file-1/detail.jpg', width: 800, height: 450 })
    // ... and the metadata, which is what enables the form and lets the bulk save send the row.
    expect(row.canEditMetadata).toBe(true)
    expect(row.keywords).toEqual(['keyword-server'])
    expect(row.authors).toEqual(['author-server'])
    expect(row.customData).toEqual({ title: 'from the server' })
    expect(row.mainFileSingleUse).toBe(true)
    expect(row.authorConflicts).toEqual(['author-a', 'author-b'])
    expect([...store.queues[QUEUE].suggestions.newAuthorNames]).toEqual(['New Author'])
    expect([...store.queues[QUEUE].suggestions.newKeywordNames]).toEqual(['new keyword'])
    // The ids are the ones the start request answered with.
    expect([row.assetId, row.fileId]).toEqual(['asset-1', 'file-1'])
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 1])
  })

  it('is asked about no more once it is settled', async () => {
    const store = await load()
    await uploadToProcessing(store, [waitingUpload()])
    server.asset(assetDetail('asset-1'))
    await vi.advanceTimersByTimeAsync(ONE_READ)
    const readsToSettle = server.assetReads('asset-1')

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.assetReads('asset-1')).toBe(readsToSettle)
  })

  it('frees its place in the queue for the upload that waits', async () => {
    const store = await load()
    const rows = seedQueue(store, QUEUE, [
      waitingUpload(),
      waitingUpload(),
      // Two at a time: this one starts when one of the two is handed over to processing.
      waitingUpload(),
    ])
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(rows.map((row) => row.status)).toEqual(['processing', 'processing', 'processing'])
    expect(server.sent('POST', /\/image\/licence\/1$/)).toHaveLength(3)
  })

  it('has all it needs from the one read that finds the file processed, whatever becomes of the server after', async () => {
    const store = await load()
    const [row] = await uploadToProcessing(store, [waitingUpload()])
    let reads = 0
    server.assetBy('asset-1', () => {
      reads++
      // The read that finds the file processed answers; the server is gone for whatever is asked after it.
      if (reads > 1) throw new Error('the asset service is down')

      return assetDetail('asset-1')
    })

    await vi.advanceTimersByTimeAsync(ONE_READ)

    // The state and the metadata come with the same answer: nothing is left that a second read would have to bring.
    expect(row.status).toBe('uploaded')
    expect(row.canEditMetadata).toBe(true)
    expect(row.keywords).toEqual(['keyword-server'])
    expect(row.error.hasError).toBe(false)
    expect(reads).toBe(1)
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 1])
  })

  it('is read again after a read that failed', async () => {
    const store = await load()
    const [row] = await uploadToProcessing(store, [waitingUpload()])
    let reads = 0
    server.assetBy('asset-1', () => {
      reads++
      if (reads === 1) throw new Error('the asset service is down')

      return assetDetail('asset-1')
    })

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(row.status).toBe('uploaded')
    expect(row.canEditMetadata).toBe(true)
  })
})

describe('an import from an external provider no notification comes for', () => {
  const waitingImport = () =>
    queueRow({
      type: 'externalProviderAsset',
      status: 'waiting',
      assetId: null,
      fileId: null,
      externalProviderAssetId: 'photo-9',
      externalProviderName: 'unsplash',
    })

  // An import has no upload whose finish would hand it over: the store itself puts it among the rows asked about.
  it('is settled by a read of its asset', async () => {
    const store = await load()
    const [row] = await uploadToProcessing(store, [waitingImport()])
    expect(server.sent('POST', /\/image\/licence\/1\/external-provider$/)).toHaveLength(1)
    expect([row.assetId, row.fileId]).toEqual(['asset-1', 'file-1'])
    server.asset(assetDetail('asset-1'))

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(server.assetReads('asset-1')).toBeGreaterThan(0)
    expect(row.status).toBe('uploaded')
    expect(row.canEditMetadata).toBe(true)
    expect(row.keywords).toEqual(['keyword-server'])
    expect(row.customData).toEqual({ title: 'from the server' })
  })
})

describe('a row taken out of the queue while its asset is still being processed', () => {
  const leave: Array<[string, (store: Store, row: UploadQueueItem) => unknown]> = [
    ['removed by its asset', (store) => store.removeByAssetId(QUEUE, 'asset-1')],
    ['stopped on its own', (store, row) => store.stopItemUpload(QUEUE, row)],
    ['stopped with the whole queue', (store) => store.stopUpload(QUEUE)],
    ['cleared with the queue', (store) => store.clearQueue(QUEUE)],
  ]

  it.each(leave)('is asked about no more: %s', async (_name, act) => {
    const store = await load()
    const [row] = await uploadToProcessing(store, [waitingUpload()])
    server.asset(assetDetail('asset-1'))

    await act(store, row)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.assetReads('asset-1')).toBe(0)
    expect(store.getQueueItems(QUEUE)).toEqual([])
  })
})
