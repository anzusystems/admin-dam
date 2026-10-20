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
import type { FakeAssetFile, FakeDam } from '@/test/support/fakeDam'

/* A file uploaded into a slot of an existing asset, with no notification ever delivered. The asset speaks only
 * of its main file, so the poll asks for the list of the slots of the asset, which carries the file of every
 * slot, and settles the row by its own file. The real upload, poll and store over a fake server. */

let server: FakeDam

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
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
// Far enough for one read of the poll, whatever its rhythm.
const ONE_READ = 20_000
// Far enough for the reads after which a file that is not there is given up on.
const SEVERAL_READS = 60_000
const A_LONG_TIME = 30 * 60_000

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
  expect(server.sent('POST').map((request) => request.url)).toEqual([
    '/adm/v1/image/asset/asset-1/slot-name/extra',
    '/adm/v1/image/file-1/chunk',
  ])
  // The asset it was sent into, and the file the server made for the slot.
  expect([row.status, row.assetId, row.fileId]).toEqual(['processing', 'asset-1', 'file-1'])

  return { store, row, detailStore }
}

/** What the slot `extra` of `asset-1` holds: the file of the upload, in the state the server has brought it to. */
const slotFileIs = (status: FakeAssetFile['fileAttributes']['status'], over: Partial<FakeAssetFile> = {}) =>
  server.slotFile('asset-1', 'extra', assetFile('file-1', status, { asset: 'asset-1', ...over }))

const assetWithAnotherMainFile = (mainFile = assetFile('file-main', 'processed', { asset: 'asset-1' })) =>
  assetDetail('asset-1', { mainFile, mainFileSingleUse: true })

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

describe('a slot upload whose file is not the main file of the asset', () => {
  it('is settled by the file the list of the slots holds for it, and brought the state of the asset', async () => {
    const { store, row } = await processingSlotUpload()
    server.asset(assetWithAnotherMainFile())
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(server.slotReads('asset-1')).toBeGreaterThan(0)
    expect(row.status).toBe('uploaded')
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
    // The asset is read once the slot is settled: its state, but neither the preview nor the switch of its main
    // file, which is another picture.
    expect(server.assetReads('asset-1')).toBeGreaterThan(0)
    expect(row.assetStatus).toBe('with_file')
    expect(row.imagePreview).toBeUndefined()
    expect(row.mainFileSingleUse).toBeNull()
    // A slot row has no metadata form.
    expect([row.canEditMetadata, row.keywords, row.customData]).toEqual([false, [], {}])
    expect([store.getQueueProcessedCount(SLOTS), store.getQueueTotalCount(SLOTS)]).toEqual([1, 1])
    // And the slot it sits in stops showing an upload in progress.
    expect(store.getQueueItemForSlotItem(SLOTS, 'extra', 'asset-1')?.item.status).toBe('uploaded')
  })

  it('is asked about no more once it is settled', async () => {
    const { row } = await processingSlotUpload()
    server.asset(assetWithAnotherMainFile())
    slotFileIs('processed')
    await vi.advanceTimersByTimeAsync(ONE_READ)
    expect(row.status).toBe('uploaded')
    const reads = [server.slotReads('asset-1'), server.assetReads('asset-1')]

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect([server.slotReads('asset-1'), server.assetReads('asset-1')]).toEqual(reads)
  })

  it.each(['uploading', 'uploaded', 'stored'] as const)(
    'waits on while its file is %s, and is settled by a later read that finds it processed',
    async (status) => {
      const { store, row } = await processingSlotUpload()
      server.asset(assetWithAnotherMainFile())
      slotFileIs(status)

      await vi.advanceTimersByTimeAsync(ONE_READ)

      expect(server.slotReads('asset-1')).toBeGreaterThan(0)
      expect([row.status, row.error.hasError]).toEqual(['processing', false])
      // Nothing is taken from the asset for a row that is not settled yet.
      expect(server.assetReads('asset-1')).toBe(0)
      expect(row.assetStatus).toBe('draft')
      expect([store.getQueueProcessedCount(SLOTS), store.getQueueTotalCount(SLOTS)]).toEqual([0, 1])

      slotFileIs('processed')
      await vi.advanceTimersByTimeAsync(5 * 60_000)

      expect([row.status, row.assetStatus]).toEqual(['uploaded', 'with_file'])
    }
  )

  it('says after a long time that it takes too long, in a text that sends the user to no refresh button', async () => {
    const { store, row } = await processingSlotUpload()
    server.asset(assetWithAnotherMainFile())
    slotFileIs('stored')

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(row.status).toBe('processing')
    expect(row.error.hasError).toBe(true)
    // The slot row has only Cancel.
    expect(row.error.message).toBe('system.uploadErrors.processingTooLongSlot')
    expect([store.getQueueProcessedCount(SLOTS), store.getQueueTotalCount(SLOTS)]).toEqual([0, 1])
    const reads = server.slotReads('asset-1')

    // It is asked about on, and the text goes when the file is done after all.
    slotFileIs('processed')
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.slotReads('asset-1')).toBeGreaterThan(reads)
    expect(row.status).toBe('uploaded')
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
  })

  // The main file of the asset is another file: what became of it is not the news of this row.
  it('takes its state from its own file, not from the main file of the asset', async () => {
    const { row } = await processingSlotUpload()
    const failedMain = assetFile('file-main', 'failed', { asset: 'asset-1' })
    failedMain.fileAttributes.failReason = 'invalid_mime_type'
    server.asset(assetWithAnotherMainFile(failedMain))
    slotFileIs('stored')
    await vi.advanceTimersByTimeAsync(ONE_READ)
    expect([row.status, row.error.hasError]).toEqual(['processing', false])

    slotFileIs('processed')
    await vi.advanceTimersByTimeAsync(SEVERAL_READS)

    // Settled, and the read of the asset that follows does not take it back for the failure of the other file.
    expect(server.assetReads('asset-1')).toBeGreaterThan(0)
    expect([row.status, row.isDuplicate, row.error.hasError]).toEqual(['uploaded', false, false])
  })

  it('fails with the reason of its own file when the list shows it failed', async () => {
    const { store, row } = await processingSlotUpload()
    server.asset(assetWithAnotherMainFile())
    const failed = assetFile('file-1', 'failed', { asset: 'asset-1' })
    failed.fileAttributes.failReason = 'invalid_size'
    server.slotFile('asset-1', 'extra', failed)

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(row.status).toBe('failed')
    expect(row.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_size' })
    expect([store.getQueueProcessedCount(SLOTS), store.getQueueTotalCount(SLOTS)]).toEqual([1, 1])
    const reads = server.slotReads('asset-1')

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.slotReads('asset-1')).toBe(reads)
  })

  it('is marked a duplicate of the file its own file names, read where files of its type live', async () => {
    const { row } = await processingSlotUpload()
    server.asset(assetWithAnotherMainFile())
    slotFileIs('duplicate', { originAssetFile: 'file-origin' })
    server.file(
      'image',
      assetFile('file-origin', 'processed', {
        asset: 'asset-original',
        flags: { singleUse: true, internal: false, overrideInternal: false },
      })
    )

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect([row.status, row.isDuplicate, row.canEditMetadata]).toEqual(['uploaded', true, false])
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
    expect(server.sent('GET', /\/file-origin$/).map((request) => request.url)).toEqual(['/adm/v1/image/file-origin'])
    expect([row.assetId, row.duplicateAssetId, row.fileId]).toEqual(['asset-1', 'asset-original', 'file-origin'])
  })

  // The one thing left to the user while it waits: the row has no refresh button.
  it('can be cancelled, which takes it out of the queue and ends the asking', async () => {
    const { store, row } = await processingSlotUpload()
    server.asset(assetWithAnotherMainFile())
    slotFileIs('stored')
    await vi.advanceTimersByTimeAsync(ONE_READ)
    const reads = server.slotReads('asset-1')
    expect(reads).toBeGreaterThan(0)

    await store.stopItemUpload(SLOTS, row)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(store.getQueueItems(SLOTS)).toEqual([])
    expect(store.getQueueItemForSlotItem(SLOTS, 'extra', 'asset-1')).toBeUndefined()
    expect(server.slotReads('asset-1')).toBe(reads)
    expect(server.assetReads('asset-1')).toBe(0)
    // Nothing is taken back on the server: the file stays in its slot.
    expect(server.sent('DELETE')).toEqual([])
  })
})

describe('a slot upload whose file becomes the main file of the asset', () => {
  // An asset created empty: the first file put into a slot is its main one.
  it('is settled from the list of the slots and completed from the asset, with no metadata of its own', async () => {
    const { store, row } = await processingSlotUpload()
    server.asset(assetDetail('asset-1', { mainFileSingleUse: true }))
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(row.status).toBe('uploaded')
    expect(row.assetStatus).toBe('with_file')
    expect(row.imagePreview).toEqual({ url: 'https://dam.test/file-1/detail.jpg', width: 800, height: 450 })
    expect(row.mainFileSingleUse).toBe(true)
    // A slot row has no metadata form.
    expect([row.canEditMetadata, row.keywords, row.customData]).toEqual([false, [], {}])
    expect([store.getQueueProcessedCount(SLOTS), store.getQueueTotalCount(SLOTS)]).toEqual([1, 1])
  })

  /* The page that draws the detail reads the asset for it, as for any main file the server is done with: the file
   * is not written into the detail here, under a form read before it. */
  it('tells the page of the open detail of the asset, which reads it for its main file', async () => {
    const { row, detailStore } = await processingSlotUpload()
    detailStore.asset = assetDetail('asset-1', { mainFile: null }) as unknown as AssetDetailItemDto
    const pageTold = vi.fn()
    detailStore.tellPageBy(pageTold)
    server.asset(assetDetail('asset-1'))
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(row.status).toBe('uploaded')
    expect(pageTold).toHaveBeenCalled()
    expect(detailStore.asset?.mainFile).toBeNull()
  })

  it('leaves the open detail of another asset alone', async () => {
    const { row, detailStore } = await processingSlotUpload()
    detailStore.asset = assetDetail('asset-2', { mainFile: null }) as unknown as AssetDetailItemDto
    const pageTold = vi.fn()
    detailStore.tellPageBy(pageTold)
    server.asset(assetDetail('asset-1'))
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(row.status).toBe('uploaded')
    expect(pageTold).not.toHaveBeenCalled()
    expect(detailStore.asset?.mainFile).toBeNull()
  })

  it('leaves a main file the open detail already has', async () => {
    const { row, detailStore } = await processingSlotUpload()
    detailStore.asset = assetDetail('asset-1', {
      mainFile: assetFile('file-kept'),
    }) as unknown as AssetDetailItemDto
    const pageTold = vi.fn()
    detailStore.tellPageBy(pageTold)
    server.asset(assetDetail('asset-1'))
    slotFileIs('processed')

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(row.status).toBe('uploaded')
    // Not written into the detail. Its page is told, as of any file of an asset that is not described the server has
    // processed: it may have filled in the metadata from it.
    expect(pageTold).toHaveBeenCalledTimes(1)
    expect(detailStore.asset?.mainFile?.id).toBe('file-kept')
  })
})

describe('two files uploaded into two slots of one asset', () => {
  const twoSlotUploads = async () => {
    const { store } = await load()
    const rows = seedQueue(store, SLOTS, [waitingSlotUpload(), waitingSlotUpload({ slotName: 'bonus' })])
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(0)
    expect(rows.map((row) => [row.status, row.fileId])).toEqual([
      ['processing', 'file-1'],
      ['processing', 'file-2'],
    ])

    return { store, rows }
  }

  it('are asked about in one read of the slots of the asset, and settled each by its own file', async () => {
    const { rows } = await twoSlotUploads()
    server.asset(assetWithAnotherMainFile())
    server.slotFile('asset-1', 'extra', assetFile('file-1', 'processed', { asset: 'asset-1' }))
    const failed = assetFile('file-2', 'failed', { asset: 'asset-1' })
    failed.fileAttributes.failReason = 'invalid_checksum'
    server.slotFile('asset-1', 'bonus', failed)

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(rows.map((row) => row.status)).toEqual(['uploaded', 'failed'])
    expect(rows[0].error.hasError).toBe(false)
    expect(rows[1].error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_checksum' })
    // One request for both rows, and none after both are settled.
    expect(server.slotReads('asset-1')).toBe(1)
  })

  it('do not settle each other: the one whose file is done leaves the other waiting', async () => {
    const { rows } = await twoSlotUploads()
    server.asset(assetWithAnotherMainFile())
    server.slotFile('asset-1', 'extra', assetFile('file-1', 'processed', { asset: 'asset-1' }))
    server.slotFile('asset-1', 'bonus', assetFile('file-2', 'stored', { asset: 'asset-1' }))

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(rows.map((row) => row.status)).toEqual(['uploaded', 'processing'])

    server.slotFile('asset-1', 'bonus', assetFile('file-2', 'processed', { asset: 'asset-1' }))
    await vi.advanceTimersByTimeAsync(5 * 60_000)

    expect(rows.map((row) => row.status)).toEqual(['uploaded', 'uploaded'])
  })
})

describe('a slot upload whose file the server cannot tell about', () => {
  it('fails with a text of its own once its file was missing from three lists that were read', async () => {
    const { store, row } = await processingSlotUpload()
    server.asset(assetWithAnotherMainFile())
    // The slot is there, and holds no file.
    server.slotFile('asset-1', 'extra', null)

    await vi.advanceTimersByTimeAsync(SEVERAL_READS)

    expect(server.slotReads('asset-1')).toBe(3)
    expect(row.status).toBe('failed')
    expect(row.error.hasError).toBe(true)
    expect(row.error.message).toBe('system.uploadErrors.fileMissing')
    expect([store.getQueueProcessedCount(SLOTS), store.getQueueTotalCount(SLOTS)]).toEqual([1, 1])
  })

  // Deleted while its file was being processed: the server answers 404 for the list of its slots, which is an
  // answer - the file is in no slot of an asset that is not there.
  it('fails with a text of its own once the server did not know its asset three times', async () => {
    const { store, row } = await processingSlotUpload()
    server.assetDeleted('asset-1')

    await vi.advanceTimersByTimeAsync(SEVERAL_READS)

    expect(server.slotReads('asset-1')).toBe(3)
    expect(row.status).toBe('failed')
    expect(row.error).toEqual({
      hasError: true,
      message: 'system.uploadErrors.fileMissing',
      assetFileFailReason: 'none',
    })
    expect([store.getQueueProcessedCount(SLOTS), store.getQueueTotalCount(SLOTS)]).toEqual([1, 1])

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.slotReads('asset-1')).toBe(3)
  })

  const unreadable: Array<[string, () => unknown]> = [
    [
      'cannot be read',
      () => {
        throw new Error('the asset service is down')
      },
    ],
    [
      'is refused by a server in trouble',
      () => {
        throw httpError(500)
      },
    ],
    ['is answered by something that is no list', () => ({ data: { extra: 'file-1' }, totalCount: 1 })],
    ['is answered by nothing at all', () => undefined],
  ]

  // Only a list that was read says a file is missing: a read that failed says nothing.
  it.each(unreadable)(
    'is not given up on while the list %s, and is settled when it is read again',
    async (_name, answer) => {
      const { row } = await processingSlotUpload()
      server.asset(assetWithAnotherMainFile())
      server.slotsBy('asset-1', answer)

      await vi.advanceTimersByTimeAsync(10 * 60_000)

      expect(server.slotReads('asset-1')).toBeGreaterThan(3)
      expect(row.status).toBe('processing')
      // No text of metadata that could not be loaded either: a slot row has no metadata, and no refresh button.
      expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })

      server.slotsBy('asset-1', () => ({
        data: [{ slotName: 'extra', assetFile: assetFile('file-1', 'processed', { asset: 'asset-1' }) }],
        totalCount: 1,
      }))
      await vi.advanceTimersByTimeAsync(10 * 60_000)

      expect(row.status).toBe('uploaded')
    }
  )
})
