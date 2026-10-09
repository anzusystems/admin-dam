import type { DamAssetTypeType, UploadQueueItem } from '@anzusystems/common-admin'
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

/* What one read of the poll does to a row, by what the server says about the file. As in
 * `fallbackSettlesQueue.test.ts`: the real upload, the real poll, the real store, a fake server and no
 * notification. */

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

const QUEUE = 'global'
// Far enough for one read of the poll, whatever its rhythm.
const ONE_READ = 20_000
const A_LONG_TIME = 30 * 60_000

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { envConfig } = await import('@/shared/EnvConfigService')
  envConfig.uploadStatusFallback = true
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore())
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

  return useUploadQueuesStore()
}

const waitingUpload = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({
    status: 'waiting',
    assetId: null,
    fileId: null,
    file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
    ...over,
  })

/** An upload of one file, taken as far as the server's answer to its finish request. */
const processingUpload = async (over: Partial<UploadQueueItem> = {}) => {
  const store = await load()
  const [row] = seedQueue(store, QUEUE, [waitingUpload(over)])
  store.processUpload(QUEUE)
  await vi.advanceTimersByTimeAsync(0)
  expect([row.status, row.assetId, row.fileId]).toEqual(['processing', 'asset-1', 'file-1'])

  return { store, row }
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

describe('a read that finds the file failed', () => {
  it('fails the row with the reason the server gives, and asks no more', async () => {
    const { store, row } = await processingUpload()
    const failed = assetFile('file-1', 'failed', { asset: 'asset-1' })
    failed.fileAttributes.failReason = 'invalid_mime_type'
    server.asset(assetDetail('asset-1', { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: failed }))

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(row.status).toBe('failed')
    // The reason and no message: the row prints the message over the reason.
    expect(row.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_mime_type' })
    expect(row.canEditMetadata).toBe(false)
    expect(row.isDuplicate).toBe(false)
    // A failed row is a finished one for the counter of the overlay.
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 1])
    const readsToSettle = server.assetReads('asset-1')
    expect(readsToSettle).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.assetReads('asset-1')).toBe(readsToSettle)
    expect(row.status).toBe('failed')
  })
})

describe('a read that finds the file a duplicate', () => {
  const types: Array<[DamAssetTypeType, string]> = [
    ['image', 'image/jpeg'],
    ['audio', 'audio/mpeg'],
    ['video', 'video/mp4'],
    ['document', 'application/pdf'],
  ]

  // The asset says which file it duplicates, and the file is read from the address of its own type.
  it.each(types)('settles the %s row read-only and links it to the original', async (assetType, mimeType) => {
    const { store, row } = await processingUpload({
      assetType,
      file: new File(['abc'], 'upload', { type: mimeType }),
    })
    server.asset(
      assetDetail('asset-1', {
        attributes: { assetType, assetStatus: 'draft' },
        mainFile: assetFile('file-1', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' }),
      })
    )
    server.file(
      assetType,
      assetFile('file-origin', 'processed', {
        asset: 'asset-original',
        flags: { singleUse: true, internal: false, overrideInternal: false },
      })
    )

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(row.status).toBe('uploaded')
    expect(row.isDuplicate).toBe(true)
    // A duplicate has no metadata of its own to edit; the bulk save skips it.
    expect(row.canEditMetadata).toBe(false)
    expect(row.keywords).toEqual([])
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
    // The file was asked for where files of this type live, and nowhere else.
    expect(server.sent('GET', /\/file-origin$/).map((request) => request.url)).toEqual([
      `/adm/v1/${assetType}/file-origin`,
    ])
    // What the original gives the row: the link to it, its file, its single-use switch and its preview. The row
    // keeps the asset the upload created.
    expect(row.assetId).toBe('asset-1')
    expect(row.duplicateAssetId).toBe('asset-original')
    expect(row.fileId).toBe('file-origin')
    expect(row.mainFileSingleUse).toBe(true)
    expect(row.imagePreview).toEqual({ url: 'https://dam.test/file-origin/detail.jpg', width: 800, height: 450 })
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 1])
  })

  it('settles the row all the same when the original cannot be read', async () => {
    const { row } = await processingUpload()
    server.asset(
      assetDetail('asset-1', {
        mainFile: assetFile('file-1', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' }),
      })
    )
    server.fileBy('image', 'file-origin', () => {
      throw new Error('the origin file is gone')
    })

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect([row.status, row.isDuplicate, row.canEditMetadata]).toEqual(['uploaded', true, false])
    // Nothing to link it with: the row keeps its own file.
    expect([row.fileId, row.duplicateAssetId]).toEqual(['file-1', null])
  })
})

describe('a read that finds the file not finished yet', () => {
  const notYet: Array<[string, Record<string, unknown>]> = [
    ['a file still uploading', { mainFile: assetFile('file-1', 'uploading') }],
    ['a file uploaded', { mainFile: assetFile('file-1', 'uploaded') }],
    ['a file stored', { mainFile: assetFile('file-1', 'stored') }],
    ['an asset with no main file', { mainFile: null }],
    // The main file of the asset is another one: its news is not this row's.
    ['another file as the main one', { mainFile: assetFile('file-other', 'processed') }],
  ]

  it.each(notYet)('leaves the row as it is and reads again later: %s', async (_name, over) => {
    const { row } = await processingUpload()
    server.asset(assetDetail('asset-1', { attributes: { assetType: 'image', assetStatus: 'draft' }, ...over }))

    await vi.advanceTimersByTimeAsync(ONE_READ)

    expect(server.assetReads('asset-1')).toBeGreaterThan(0)
    expect(row.status).toBe('processing')
    expect(row.error.hasError).toBe(false)
    expect(row.canEditMetadata).toBe(false)
    expect(row.assetStatus).toBe('draft')

    // The server finishes; a later read finds it.
    server.asset(assetDetail('asset-1'))
    await vi.advanceTimersByTimeAsync(5 * 60_000)

    expect(row.status).toBe('uploaded')
    expect(row.canEditMetadata).toBe(true)
  })

  it('says so on the row when the file is not finished for a long time, and leaves the row processing', async () => {
    const { store, row } = await processingUpload()
    server.asset(
      assetDetail('asset-1', {
        attributes: { assetType: 'image', assetStatus: 'draft' },
        mainFile: assetFile('file-1', 'stored'),
      })
    )

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.assetReads('asset-1')).toBeGreaterThan(1)
    expect(row.status).toBe('processing')
    expect(row.error.hasError).toBe(true)
    // The wording of an ordinary upload: it sends the user to the refresh button of the row.
    expect(row.error.message).toBe('system.uploadErrors.processingTooLong')
    // Not a finished row: the overlay goes on counting it as unfinished.
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([0, 1])
  })
})

describe('an upload stopped while its finish request is on the wire', () => {
  it('stays stopped, and its asset is never read', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    server.on('PATCH', /\/image\/file-1\/uploaded$/, async () => {
      await store.stopItemUpload(QUEUE, row)

      return { status: 200, data: {} }
    })
    server.asset(assetDetail('asset-1'))

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    // `Processing` written over it would have left a row nobody watches being asked about for minutes.
    expect(row.status).toBe('stop')
    expect(store.getQueueItems(QUEUE)).toEqual([])
    expect(server.assetReads('asset-1')).toBe(0)
  })
})
