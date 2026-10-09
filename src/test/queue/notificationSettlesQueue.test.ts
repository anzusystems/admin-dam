import type { AssetDetailItemDto, DamAssetTypeType, UploadQueueItem } from '@anzusystems/common-admin'
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

/* What a notification does to the rows of the queues: the real listener and the real store, a fake server and a
 * fake connection. The server always holds what the notification says, so a case reads the same whether the row
 * is written from the event or from the asset read after it. */

let server: FakeDam
const listeners: Array<(event: { name: string; data: unknown }) => void> = []

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  initDamNotifications: () => ({ openConnection: () => undefined }),
  useDamNotifications: () => ({
    addDamNotificationListener: (listener: (event: { name: string; data: unknown }) => void) => {
      listeners.push(listener)

      return () => undefined
    },
  }),
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

const GLOBAL = 'global'
const SLOTS = 'slots'
const EDIT = 'edit'
// Long enough for whatever a notification sets off to have answered.
const AFTER_EVENT = 5_000
const A_LONG_TIME = 30 * 60_000

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { envConfig } = await import('@/shared/EnvConfigService')
  envConfig.uploadStatusFallback = true
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore())
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')
  const { useAssetDetailStore } = await import('@/domains/coreDam/asset/store/assetDetailStore')

  return { store: useUploadQueuesStore(), detailStore: useAssetDetailStore() }
}

const notify = async (name: string, data: Record<string, unknown>) => {
  listeners.forEach((listener) => listener({ name, data }))
  await vi.advanceTimersByTimeAsync(AFTER_EVENT)
}

const processed = (fileId = 'file-1') => notify('asset_file_processed', { asset: 'asset-1', id: fileId })
const metadata = () => notify('asset_metadata_processed', { asset: 'asset-1' })
const failed = (failReason: string, fileId = 'file-1') =>
  notify('asset_file_failed', { asset: 'asset-1', id: fileId, failReason })
const duplicate = (assetType: string, fileId = 'file-1') =>
  notify('asset_file_duplicate', { asset: 'asset-1', id: fileId, originAssetFile: 'file-origin', assetType })

const draft = (mainFile: unknown, assetType = 'image') =>
  assetDetail('asset-1', { attributes: { assetType, assetStatus: 'draft' }, mainFile })
const failedFile = (failReason: string) => {
  const file = assetFile('file-1', 'failed', { asset: 'asset-1' })
  file.fileAttributes.failReason = failReason

  return file
}

const NO_ERROR = { hasError: false, message: '', assetFileFailReason: 'none' }
const PREVIEW = { url: 'https://dam.test/file-1/detail.jpg', width: 800, height: 450 }

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  stubFileReader()
  listeners.length = 0
  server = createFakeDam()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('a notification that the file is processed', () => {
  it('settles the upload row and brings it what the asset says, the form staying off until its metadata', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [
      queueRow({
        status: 'processing',
        error: { hasError: true, message: 'system.uploadErrors.processingTooLong', assetFileFailReason: 'unknown' },
      }),
    ])
    server.asset(assetDetail('asset-1', { mainFileSingleUse: true }))

    await processed()

    expect(row.status).toBe('uploaded')
    // The reason goes with the error: some rows print it in place of the message.
    expect(row.error).toEqual(NO_ERROR)
    expect(row.assetStatus).toBe('with_file')
    expect(row.imagePreview).toEqual(PREVIEW)
    // No form yet, so the switch is still the server's to say.
    expect(row.mainFileSingleUse).toBe(true)
    expect(row.canEditMetadata).toBe(false)
    expect(row.keywords).toEqual([])
    expect([store.getQueueProcessedCount(GLOBAL), store.getQueueTotalCount(GLOBAL)]).toEqual([1, 1])
  })

  // A slot answers to its own file; the main file of the asset is another one and describes another picture.
  it('settles a slot upload without the preview and the switch of the main file', async () => {
    const { store } = await load()
    const [slot, other] = seedQueue(store, SLOTS, [
      queueRow({ type: 'slotFile', status: 'processing', fileId: 'file-2', slotName: 'extra' }),
      queueRow({ type: 'slotFile', status: 'processing', fileId: 'file-3', slotName: 'bonus' }),
    ])
    server.asset(assetDetail('asset-1', { mainFileSingleUse: true }))

    await processed('file-2')

    expect([slot.status, slot.assetStatus]).toEqual(['uploaded', 'with_file'])
    expect(slot.imagePreview).toBeUndefined()
    expect(slot.mainFileSingleUse).toBeNull()
    expect(slot.canEditMetadata).toBe(false)
    // And the other slot of the same asset has heard nothing about its own file.
    expect(other.status).toBe('processing')
  })

  it('does not put the row back to processing when it comes before the answer to the finish request', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [
      queueRow({
        status: 'waiting',
        assetId: null,
        fileId: null,
        file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
      }),
    ])
    server.asset(assetDetail('asset-1'))
    server.on('PATCH', /\/image\/file-1\/uploaded$/, async () => {
      listeners.forEach((listener) =>
        listener({ name: 'asset_file_processed', data: { asset: 'asset-1', id: 'file-1' } })
      )
      await Promise.resolve()

      return { status: 200, data: {} }
    })

    store.processUpload(GLOBAL)
    await vi.advanceTimersByTimeAsync(0)

    // Asked as soon as the finish request has answered, before any poll could have settled the row a second time:
    // `Processing` written over it waits for a notification that has already been.
    expect(row.status).toBe('uploaded')
    expect(row.error).toEqual(NO_ERROR)
    await vi.advanceTimersByTimeAsync(AFTER_EVENT)
    expect(row.status).toBe('uploaded')
    const readsAfterTheEvent = server.assetReads('asset-1')

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    // And no poll was armed for it: the finish answer found the row settled and left it alone.
    expect(server.assetReads('asset-1')).toBe(readsAfterTheEvent)
    expect(row.status).toBe('uploaded')
  })

  it('ends the asking about a row that waited for it', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [
      queueRow({
        status: 'waiting',
        assetId: null,
        fileId: null,
        file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
      }),
    ])
    store.processUpload(GLOBAL)
    await vi.advanceTimersByTimeAsync(0)
    expect(row.status).toBe('processing')
    // The server still works on the file: what is read meanwhile gives the row its form, not its end.
    server.asset(assetDetail('asset-1', { mainFile: assetFile('file-1', 'stored', { asset: 'asset-1' }) }))
    await metadata()
    expect([row.status, row.canEditMetadata]).toEqual(['processing', true])
    expect(server.assetReads('asset-1')).toBeGreaterThan(0)

    server.asset(assetDetail('asset-1'))
    await processed()
    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', true])
    const readsToSettle = server.assetReads('asset-1')

    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.assetReads('asset-1')).toBe(readsToSettle)
  })

  // Its status belongs to the batch that loaded it: the notification only brings the row up to date.
  it('clears the error of a mass-edit row whose file had failed, and leaves it failed', async () => {
    const { store } = await load()
    const [picked] = seedQueue(store, EDIT, [
      queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true, keywords: ['typed'] }),
    ])
    server.asset(draft(failedFile('invalid_mime_type')))
    await failed('invalid_mime_type')
    expect([picked.status, picked.error.assetFileFailReason]).toEqual(['failed', 'invalid_mime_type'])

    server.asset(assetDetail('asset-1'))
    await processed()

    expect(picked.status).toBe('failed')
    expect(picked.error).toEqual(NO_ERROR)
    expect(picked.assetStatus).toBe('with_file')
  })
})

describe('a notification that the file failed', () => {
  it('fails the row with its reason in place of whatever the row said before', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [
      queueRow({
        status: 'processing',
        canEditMetadata: true,
        error: { hasError: true, message: 'system.uploadErrors.processingTooLong', assetFileFailReason: 'none' },
      }),
    ])
    server.asset(draft(failedFile('invalid_size')))

    await failed('invalid_size')

    expect(row.status).toBe('failed')
    // The row prints the message over the reason, and the old message is not why it failed.
    expect(row.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_size' })
    expect(row.canEditMetadata).toBe(false)
    expect([store.getQueueProcessedCount(GLOBAL), store.getQueueTotalCount(GLOBAL)]).toEqual([1, 1])
  })

  it('fails a row that had been settled as uploaded', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [
      queueRow({ status: 'uploaded', assetStatus: 'with_file', canEditMetadata: true, keywords: ['typed'] }),
    ])
    server.asset(draft(failedFile('unknown')))

    await failed('unknown')

    expect([row.status, row.canEditMetadata]).toEqual(['failed', false])
    expect(row.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'unknown' })
    // What the user typed is still on the row; only the form is gone.
    expect(row.keywords).toEqual(['typed'])
  })

  it('is what is wrong with the row from then on, not the metadata that could not be read before it', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [queueRow({ status: 'processing' })])
    server.assetBy('asset-1', () => {
      throw new Error('the asset service is down')
    })
    await metadata()
    // The read is tried twice more before the row says its metadata could not be loaded.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(server.assetReads('asset-1')).toBe(3)
    expect([row.canEditMetadata, row.error.message]).toEqual([false, 'system.uploadErrors.metadataFailed'])

    server.asset(draft(failedFile('invalid_checksum')))
    await failed('invalid_checksum')
    expect(row.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_checksum' })

    // Its metadata comes after all: a failed row has no form to put it in.
    await metadata()

    expect([row.status, row.canEditMetadata]).toEqual(['failed', false])
    expect(row.keywords).toEqual([])
    expect(row.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_checksum' })
  })

  it('starts the upload that waited for the place of the failed one', async () => {
    const { store } = await load()
    // Ids of their own: the server numbers the upload it starts from one, and a row is asked about by its ids.
    const [, , waiting] = seedQueue(store, GLOBAL, [
      queueRow({ status: 'uploading', assetId: 'asset-8', fileId: 'file-8' }),
      queueRow({ status: 'uploading', assetId: 'asset-9', fileId: 'file-9' }),
      queueRow({
        status: 'waiting',
        assetId: null,
        fileId: null,
        file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
      }),
    ])
    const file = assetFile('file-8', 'failed', { asset: 'asset-8' })
    file.fileAttributes.failReason = 'unknown'
    server.asset(assetDetail('asset-8', { attributes: { assetType: 'image', assetStatus: 'draft' }, mainFile: file }))

    await notify('asset_file_failed', { asset: 'asset-8', id: 'file-8', failReason: 'unknown' })

    expect(server.sent('POST', /\/image\/licence\/1$/)).toHaveLength(1)
    expect(waiting.status).toBe('processing')
  })
})

describe('a notification that the file is a duplicate', () => {
  const types: DamAssetTypeType[] = ['image', 'audio', 'video', 'document']

  it.each(types)('settles the %s row read-only and links it to the original', async (assetType) => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [
      queueRow({
        status: 'processing',
        assetType,
        canEditMetadata: true,
        error: { hasError: true, message: 'system.uploadErrors.processingTooLong', assetFileFailReason: 'none' },
      }),
    ])
    server.asset(
      draft(assetFile('file-1', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' }), assetType)
    )
    server.file(
      assetType,
      assetFile('file-origin', 'processed', {
        asset: 'asset-original',
        flags: { singleUse: true, internal: false, overrideInternal: false },
      })
    )

    await duplicate(assetType)

    expect([row.status, row.isDuplicate, row.canEditMetadata]).toEqual(['uploaded', true, false])
    expect(row.error).toEqual(NO_ERROR)
    expect(server.sent('GET', /\/file-origin$/).map((request) => request.url)).toEqual([
      `/adm/v1/${assetType}/file-origin`,
    ])
    expect([row.assetId, row.duplicateAssetId, row.fileId]).toEqual(['asset-1', 'asset-original', 'file-origin'])
    expect(row.mainFileSingleUse).toBe(true)
    expect(row.imagePreview).toEqual({ url: 'https://dam.test/file-origin/detail.jpg', width: 800, height: 450 })
    expect([store.getQueueProcessedCount(GLOBAL), store.getQueueTotalCount(GLOBAL)]).toEqual([1, 1])
  })

  it('stays read-only when its metadata notification comes after it', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [queueRow({ status: 'processing' })])
    server.asset(draft(assetFile('file-1', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' })))
    server.file('image', assetFile('file-origin', 'processed', { asset: 'asset-original' }))

    await duplicate('image')
    await metadata()

    expect([row.status, row.isDuplicate, row.canEditMetadata]).toEqual(['uploaded', true, false])
    expect(row.keywords).toEqual([])
  })

  // Picked before it had a main file: nothing says the file of the event is this row's.
  it('does not reach a mass-edit row that has no file id', async () => {
    const { store } = await load()
    const [picked] = seedQueue(store, EDIT, [
      queueRow({ type: 'asset', status: 'uploaded', fileId: null, canEditMetadata: true, keywords: ['typed'] }),
    ])
    server.asset(draft(assetFile('file-9', 'duplicate', { asset: 'asset-1', originAssetFile: 'file-origin' })))
    server.file('image', assetFile('file-origin', 'processed', { asset: 'asset-original' }))

    await duplicate('image', 'file-9')

    expect([picked.status, picked.isDuplicate, picked.canEditMetadata]).toEqual(['uploaded', false, true])
    expect([picked.fileId, picked.duplicateAssetId]).toEqual([null, null])
  })
})

describe('a notification that the metadata is processed', () => {
  // The server reads the metadata off the first chunk, so this one comes while the file still sends.
  it('gives the row its metadata and its form, and leaves its status alone', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [queueRow({ status: 'uploading' })])
    server.asset({
      ...draft(assetFile('file-1', 'uploading')),
      mainFileSingleUse: true,
      metadata: {
        customData: { title: 'from the server' },
        authorSuggestions: { 'New Author': {}, 'Known Author': ['author-a', 'author-b'] },
        keywordSuggestions: { 'new keyword': {} },
      },
    })

    await metadata()

    expect(row.status).toBe('uploading')
    expect(row.canEditMetadata).toBe(true)
    expect(row.keywords).toEqual(['keyword-server'])
    expect(row.authors).toEqual(['author-server'])
    expect(row.customData).toEqual({ title: 'from the server' })
    expect(row.mainFileSingleUse).toBe(true)
    expect(row.authorConflicts).toEqual(['author-a', 'author-b'])
    expect([...store.queues[GLOBAL].suggestions.newAuthorNames]).toEqual(['New Author'])
    expect([...store.queues[GLOBAL].suggestions.newKeywordNames]).toEqual(['new keyword'])
    expect(row.error).toEqual(NO_ERROR)
  })

  it('leaves the switch to the user once the row has its form, whatever the file notification brings', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [queueRow({ status: 'uploading' })])
    server.asset(assetDetail('asset-1', { mainFileSingleUse: false }))
    await metadata()
    row.mainFileSingleUse = true
    row.customData = { title: 'typed' }

    await processed()
    await metadata()

    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', true])
    expect(row.mainFileSingleUse).toBe(true)
    expect(row.customData).toEqual({ title: 'typed' })
  })

  it('reaches the row after all when it could not be read the first time', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [queueRow({ status: 'uploaded', assetStatus: 'with_file' })])
    server.assetBy('asset-1', () => {
      throw new Error('the asset service is down')
    })
    await metadata()
    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', false])

    server.asset(assetDetail('asset-1'))
    await metadata()

    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', true])
    expect(row.error).toEqual(NO_ERROR)
    expect(row.customData).toEqual({ title: 'from the server' })
  })

  describe('for an asset created empty and given its first file through a slot', () => {
    const emptyAsset = (id: string) => assetDetail(id, { mainFile: null }) as unknown as AssetDetailItemDto

    it('gives the open detail of that asset its main file, and the slot row nothing', async () => {
      const { store, detailStore } = await load()
      const [slot] = seedQueue(store, SLOTS, [
        queueRow({ type: 'slotFile', status: 'uploading', fileId: 'file-1', slotName: 'default' }),
      ])
      detailStore.asset = emptyAsset('asset-1')
      server.asset(assetDetail('asset-1'))

      await metadata()

      expect(detailStore.asset?.mainFile?.id).toBe('file-1')
      // A slot row has no metadata form.
      expect([slot.status, slot.canEditMetadata, slot.keywords]).toEqual(['uploading', false, []])
    })

    it('leaves the detail of another asset alone', async () => {
      const { store, detailStore } = await load()
      seedQueue(store, SLOTS, [queueRow({ type: 'slotFile', status: 'uploading', slotName: 'default' })])
      detailStore.asset = emptyAsset('asset-2')
      server.asset(assetDetail('asset-1'))

      await metadata()

      expect(detailStore.asset?.mainFile).toBeNull()
    })

    it('leaves a main file the detail already has', async () => {
      const { store, detailStore } = await load()
      seedQueue(store, SLOTS, [
        queueRow({ type: 'slotFile', status: 'uploading', fileId: 'file-2', slotName: 'extra' }),
      ])
      detailStore.asset = assetDetail('asset-1', {
        mainFile: assetFile('file-kept'),
      }) as unknown as AssetDetailItemDto
      server.asset(assetDetail('asset-1'))

      await metadata()

      expect(detailStore.asset?.mainFile?.id).toBe('file-kept')
    })

    // Whatever row of the queues the asset was read for: the detail is given what the read brought.
    it('gives the open detail its main file when the queue holds no slot upload of the asset as well', async () => {
      const { store, detailStore } = await load()
      seedQueue(store, GLOBAL, [queueRow({ status: 'uploading' })])
      detailStore.asset = emptyAsset('asset-1')
      server.asset(assetDetail('asset-1'))

      await metadata()

      expect(detailStore.asset?.mainFile?.id).toBe('file-1')
    })
  })
})

describe('one asset in two queues', () => {
  const inBoth = (store: Awaited<ReturnType<typeof load>>['store'], picked: Partial<UploadQueueItem> = {}) => {
    const [upload] = seedQueue(store, GLOBAL, [queueRow({ status: 'processing' })])
    const [massEdit] = seedQueue(store, EDIT, [
      queueRow({
        type: 'asset',
        status: 'uploaded',
        fileId: null,
        canEditMetadata: true,
        keywords: ['typed'],
        mainFileSingleUse: false,
        ...picked,
      }),
    ])

    return { upload, massEdit }
  }

  it('is settled in the upload queue and only brought up to date in the mass-edit one', async () => {
    const { store } = await load()
    const { upload, massEdit } = inBoth(store, { status: 'loading' })
    server.asset(assetDetail('asset-1', { mainFileSingleUse: true }))

    await processed()

    expect([upload.status, upload.assetStatus]).toEqual(['uploaded', 'with_file'])
    // The batch that loads the mass-edit row still owns it.
    expect(massEdit.status).toBe('loading')

    massEdit.status = 'uploaded'
    await processed()

    expect([massEdit.status, massEdit.assetStatus]).toEqual(['uploaded', 'with_file'])
    expect(massEdit.imagePreview).toEqual(PREVIEW)
    // The switch of a mass-edit row is a form field, not the server's.
    expect(massEdit.mainFileSingleUse).toBe(false)
    expect(massEdit.keywords).toEqual(['typed'])
  })

  it('fails in the upload queue only, while the mass-edit row has no file id', async () => {
    const { store } = await load()
    const { upload, massEdit } = inBoth(store)
    server.asset(draft(failedFile('unknown')))

    await failed('unknown')

    expect(upload.status).toBe('failed')
    expect([massEdit.status, massEdit.canEditMetadata, massEdit.error.hasError]).toEqual(['uploaded', true, false])
  })

  it('fails in both when the mass-edit row holds that very file', async () => {
    const { store } = await load()
    const { upload, massEdit } = inBoth(store, { fileId: 'file-1' })
    server.asset(draft(failedFile('unknown')))

    await failed('unknown')

    expect([upload.status, massEdit.status]).toEqual(['failed', 'failed'])
    expect(massEdit.canEditMetadata).toBe(false)
  })

  it('is given its metadata in the upload queue, the mass-edit row keeping what was typed', async () => {
    const { store } = await load()
    const { upload, massEdit } = inBoth(store)
    server.asset(assetDetail('asset-1'))

    await metadata()

    expect([upload.canEditMetadata, upload.keywords]).toEqual([true, ['keyword-server']])
    expect([massEdit.canEditMetadata, massEdit.keywords]).toEqual([true, ['typed']])
    // Each queue collects the new names of its own rows.
    expect(store.queues[EDIT].suggestions.newAuthorNames.size).toBe(0)
  })
})

// Its batch load answered without the asset, so the row failed for want of its metadata - which a metadata
// notification can still bring.
describe('a mass-edit row its batch load left out', () => {
  const leftOut = async (store: Awaited<ReturnType<typeof load>>['store']) => {
    await store.addByAssets(EDIT, [
      {
        id: 'asset-1',
        attributes: { assetType: 'image', assetStatus: 'with_file' },
        texts: { displayTitle: 'picked' },
        mainFile: { id: 'file-1', links: {} },
        mainFileSingleUse: null,
      },
    ] as never)
    await vi.advanceTimersByTimeAsync(0)
    const [picked] = store.getQueueItems(EDIT)
    expect([picked.status, picked.error.message]).toEqual(['failed', 'system.uploadErrors.metadataUnavailable'])

    return picked
  }

  it('gets its metadata and its form from the metadata notification, and loses the text about them', async () => {
    const { store } = await load()
    const picked = await leftOut(store)
    server.asset(assetDetail('asset-1'))

    await metadata()

    expect([picked.canEditMetadata, picked.keywords]).toEqual([true, ['keyword-server']])
    expect([picked.error.hasError, picked.error.message]).toEqual([false, ''])
  })

  // The text is still true: the metadata is what the row misses, whatever became of its file.
  it('keeps the text about its metadata when a notification says its file is processed', async () => {
    const { store } = await load()
    const picked = await leftOut(store)
    server.asset(assetDetail('asset-1'))

    await processed()

    expect([picked.status, picked.canEditMetadata, picked.assetStatus]).toEqual(['failed', false, 'with_file'])
    expect([picked.error.hasError, picked.error.message]).toEqual([true, 'system.uploadErrors.metadataUnavailable'])
  })

  // From then on the file is what is wrong with the row, and a failed row has no form.
  it('is not given them once its file has failed', async () => {
    const { store } = await load()
    const picked = await leftOut(store)
    server.asset(draft(failedFile('invalid_mime_type')))
    await failed('invalid_mime_type')
    expect(picked.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_mime_type' })

    await metadata()

    expect([picked.status, picked.canEditMetadata, picked.keywords]).toEqual(['failed', false, []])
    expect(picked.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_mime_type' })
  })
})

describe('two queues that upload at once', () => {
  it('each send two files at a time', async () => {
    const { store } = await load()
    const waiting = (over: Partial<UploadQueueItem> = {}) =>
      queueRow({
        status: 'waiting',
        assetId: null,
        fileId: null,
        file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
        ...over,
      })
    const uploads = seedQueue(store, GLOBAL, [waiting(), waiting(), waiting()])
    const slots = seedQueue(store, SLOTS, [
      waiting({ type: 'slotFile', assetId: 'asset-9', slotName: 'a' }),
      waiting({ type: 'slotFile', assetId: 'asset-9', slotName: 'b' }),
      waiting({ type: 'slotFile', assetId: 'asset-9', slotName: 'c' }),
    ])
    // The chunks never answer, so whatever has started stays uploading.
    server.on('POST', /\/chunk$/, () => new Promise(() => undefined))

    store.processUpload(GLOBAL)
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(0)

    expect(uploads.map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting'])
    expect(slots.map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting'])
    expect(server.sent('POST', /\/image\/licence\/1$/)).toHaveLength(2)
    expect(server.sent('POST', /\/image\/asset\/asset-9\/slot-name\/[abc]$/)).toHaveLength(2)
  })
})

describe('a notification the queues have no use for', () => {
  const ignored = ['asset_file_copied', 'asset_file_uploaded', 'asset_file_deleted', 'asset_deleted', 'no_such_event']

  it.each(ignored)('changes nothing and asks the server nothing: %s', async (name) => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [queueRow({ status: 'processing' })])
    const before = JSON.stringify(row)
    server.asset(assetDetail('asset-1'))

    await notify(name, { asset: 'asset-1', id: 'file-1' })

    expect(JSON.stringify(row)).toBe(before)
    expect(server.requests).toEqual([])
  })

  it('changes nothing when it names another asset', async () => {
    const { store } = await load()
    const [row] = seedQueue(store, GLOBAL, [queueRow({ status: 'processing' })])
    const before = JSON.stringify(row)
    server.asset(assetDetail('asset-2', { mainFile: assetFile('file-2', 'processed', { asset: 'asset-2' }) }))

    await notify('asset_file_processed', { asset: 'asset-2', id: 'file-2' })
    await notify('asset_metadata_processed', { asset: 'asset-2' })
    await notify('asset_file_failed', { asset: 'asset-2', id: 'file-2', failReason: 'unknown' })

    expect(JSON.stringify(row)).toBe(before)
  })
})
