import type { AssetDetailItemDto, UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  assetDetail,
  assetFile,
  createFakeDam,
  httpError,
  queueRow,
  seedDamConfig,
  seedQueue,
  stubFileReader,
} from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* What the queues tell the editor of rows that end without the notifications of the server: a slot upload given up on
 * as its file is no longer there, one ended failed or as a duplicate by the list of the slots, and a mass-edit row
 * left without its metadata. The real upload, poll and store over a fake server; the alerts are a stand-in. */

let server: FakeDam
const showError = vi.fn()
// What the notifications of the server are heard by, once the application listens to them.
const notificationListeners: Array<(event: unknown) => void> = []

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => {
  const library = (await importOriginal()) as Record<string, unknown> & { useAlerts: () => object }

  return {
    ...library,
    useAlerts: () => ({ ...library.useAlerts(), showError }),
    initDamNotifications: () => ({ openConnection: () => undefined }),
    useDamNotifications: () => ({
      addDamNotificationListener: (listener: (event: unknown) => void) => {
        notificationListeners.push(listener)

        return () => undefined
      },
    }),
  }
})
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

const SLOTS = 'slots'
const EDIT = 'edit'
// Far enough for one read of the poll, whatever its rhythm.
const ONE_READ = 20_000
// Far enough for the reads after which a file that is not there is given up on.
const SEVERAL_READS = 60_000

const waitingSlotUpload = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({
    type: 'slotFile',
    status: 'waiting',
    assetId: 'asset-1',
    fileId: null,
    slotName: 'extra',
    file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
    displayTitle: 'photo.jpg',
    ...over,
  })

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore())
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

  return { store: useUploadQueuesStore(), detailStore: useAssetDetailStore() }
}

/** One file sent into the slot `extra` of `asset-1`, as far as the server's answer to its finish request. */
const processingSlotUpload = async () => {
  const { store, detailStore } = await load()
  const [row] = seedQueue(store, SLOTS, [waitingSlotUpload()])
  store.processUpload(SLOTS)
  await vi.advanceTimersByTimeAsync(0)
  expect([row.status, row.assetId, row.fileId]).toEqual(['processing', 'asset-1', 'file-1'])

  return { store, row, detailStore }
}

/** An asset that is not described, its main file another one than the upload's, or none. */
const notDescribed = (mainFile: ReturnType<typeof assetFile> | null) =>
  assetDetail('asset-1', { mainFile, flags: { described: false } }) as unknown as AssetDetailItemDto

beforeEach(() => {
  vi.clearAllMocks()
  notificationListeners.length = 0
  vi.useFakeTimers()
  stubFileReader()
  server = createFakeDam()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('a slot upload given up on as its file is no longer on the server', () => {
  it('says so in a text of its own', async () => {
    const { row } = await processingSlotUpload()
    server.assetDeleted('asset-1')

    await vi.advanceTimersByTimeAsync(SEVERAL_READS)

    expect([row.status, row.error.message]).toEqual(['failed', 'system.uploadErrors.fileMissing'])
  })

  // Its text was the one of an unknown error, which the queue tells once: the next failure of that kind was not told.
  it('leaves the next upload of the queue that fails for an unknown error to be told of', async () => {
    const { store, row } = await processingSlotUpload()
    server.assetDeleted('asset-1')
    await vi.advanceTimersByTimeAsync(SEVERAL_READS)
    expect(row.status).toBe('failed')
    expect(showError).not.toHaveBeenCalled()
    server.on('POST', /^\/adm\/v1\/image\/asset\/asset-2\/slot-name\/extra$/, () => {
      throw httpError(500)
    })

    await store.addByFilesAsSlotUpload(
      SLOTS,
      [new File(['abc'], 'other.jpg', { type: 'image/jpeg' })],
      'asset-2',
      'extra',
      'image'
    )
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(0)

    const next = store.getQueueItems(SLOTS)[1]
    expect([next.status, next.error.message]).toEqual(['failed', 'system.uploadErrors.unknownError'])
    expect(showError.mock.calls).toEqual([['system.uploadErrors.unknownError']])
  })
})

/* A detail or a panel that holds the asset learns how the server ended a file put into a slot of it: from the
 * notifications, and from the queue only of a file processed. Without the notifications it went on holding a file
 * that failed or is a duplicate as still on its way. */
describe('a slot upload ended by the list of the slots of its asset', () => {
  it('failed: tells the page of the detail of an asset that is not described, which reads it', async () => {
    const { row, detailStore } = await processingSlotUpload()
    const other = assetFile('file-main', 'processed', { asset: 'asset-1' })
    detailStore.asset = notDescribed(other)
    const pageTold = vi.fn()
    detailStore.tellPageBy(pageTold)
    server.asset(notDescribed(other) as never)
    const failed = assetFile('file-1', 'failed', { asset: 'asset-1' })
    failed.fileAttributes.failReason = 'invalid_size'
    server.slotFile('asset-1', 'extra', failed)

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(row.status).toBe('failed')
    expect(pageTold).toHaveBeenCalledTimes(1)
  })

  it('a duplicate: tells the page of the detail of an asset that has no main file yet, which reads it', async () => {
    const { row, detailStore } = await processingSlotUpload()
    detailStore.asset = notDescribed(null)
    const pageTold = vi.fn()
    detailStore.tellPageBy(pageTold)
    server.asset(notDescribed(null) as never)
    server.slotFile(
      'asset-1',
      'extra',
      assetFile('file-1', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' })
    )
    server.file('image', assetFile('file-origin', 'processed', { asset: 'asset-original' }))

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect([row.status, row.isDuplicate]).toEqual(['uploaded', true])
    expect(pageTold).toHaveBeenCalled()
  })

  // The guard: a file given up on as no longer there was not ended by the server, and nothing is told of it.
  it('tells nothing of a file it gave up on as no longer in its slot', async () => {
    const { row, detailStore } = await processingSlotUpload()
    const other = assetFile('file-main', 'processed', { asset: 'asset-1' })
    detailStore.asset = notDescribed(other)
    const pageTold = vi.fn()
    detailStore.tellPageBy(pageTold)
    server.asset(notDescribed(other) as never)
    server.slotFile('asset-1', 'extra', null)

    await vi.advanceTimersByTimeAsync(SEVERAL_READS)

    expect([row.status, row.error.message]).toEqual(['failed', 'system.uploadErrors.fileMissing'])
    expect(pageTold).not.toHaveBeenCalled()
  })
})

/* With the notifications the end of the file is said twice: by the row of the queue the notification settles, and by
 * the listener of the application, which tells the detail of each file. The page read the asset for each of them, and
 * the first answer was given up for the second. */
describe('a slot upload ended by a notification of the server', () => {
  const notified: Array<[string, Record<string, unknown>, () => void]> = [
    [
      'asset_file_processed',
      {},
      () => server.slotFile('asset-1', 'extra', assetFile('file-1', 'processed', { asset: 'asset-1' })),
    ],
    ['asset_file_failed', { failReason: 'invalid_size' }, () => undefined],
    [
      'asset_file_duplicate',
      { originAssetFile: 'file-origin', assetType: 'image' },
      () => server.file('image', assetFile('file-origin', 'processed', { asset: 'asset-original' })),
    ],
  ]

  it.each(notified)(
    '%s: tells the page of the detail once, which reads the asset once',
    async (name, data, onServer) => {
      const { row, detailStore } = await processingSlotUpload()
      const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
      initAppNotificationListeners()
      // The detail holds the asset with the file of the upload as its main one, still on its way.
      detailStore.asset = notDescribed(assetFile('file-1', 'stored', { asset: 'asset-1' }))
      const pageTold = vi.fn()
      detailStore.tellPageBy(pageTold)
      server.asset(notDescribed(assetFile('file-1', 'stored', { asset: 'asset-1' })) as never)
      onServer()

      notificationListeners.forEach((listener) => listener({ name, data: { id: 'file-1', asset: 'asset-1', ...data } }))
      await vi.advanceTimersByTimeAsync(ONE_READ)

      expect(row.status).not.toBe('processing')
      expect(pageTold).toHaveBeenCalledTimes(1)
    }
  )
})

describe('the queues emptied by their reset', () => {
  /* A failed row gets the metadata of the notification only when it failed for want of them, as its batch left it. The
   * reset forgot the rows, and kept which of them that was: a row of the same asset picked after it was taken for it. */
  it('forget which mass-edit row its batch left without metadata', async () => {
    const { store } = await load()
    server.on('GET', /^\/adm\/v1\/asset\/licence\/1\/ids\/.+$/, () => {
      throw httpError(500)
    })
    await store.addByAssets(EDIT, [
      {
        id: 'asset-1',
        attributes: { assetType: 'image', assetStatus: 'with_file' },
        texts: { displayTitle: 'asset-1' },
        mainFile: { id: 'file-1', links: {} },
        mainFileSingleUse: null,
      },
    ] as never)
    await vi.advanceTimersByTimeAsync(0)
    const [left] = store.getQueueItems(EDIT)
    expect([left.status, left.error.message]).toEqual(['failed', 'system.uploadErrors.metadataUnavailable'])

    store.reset()
    // A row of the same asset that failed for its file, in the place of the one before.
    const [row] = seedQueue(store, EDIT, [
      queueRow({ key: left.key, type: 'asset', status: 'failed', assetId: 'asset-1', fileId: 'file-1' }),
    ])
    server.asset(assetDetail('asset-1', { keywords: ['keyword-notified'] }))
    const notified = store.queueItemMetadataProcessed('asset-1')
    await vi.advanceTimersByTimeAsync(5000)
    await notified

    expect([row.status, row.canEditMetadata]).toEqual(['failed', false])
  })
})
