import type { DamAssetTypeType, UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  assetDetail,
  createFakeDam,
  forbiddenOperationError,
  httpError,
  queueRow,
  seedDamConfig,
  seedQueue,
  stubFileReader,
  validationError,
} from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

let server: FakeDam
const showError = vi.fn()

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showError }),
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

const QUEUE = 'global'
const EVERY_RETRY = 60_000

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { i18n } = await import('@/plugins/i18n')
  i18n.global.mergeLocaleMessage('sk', {
    error: { apiForbiddenOperation: { licence_manual_upload_disabled: 'This licence takes no manual uploads.' } },
  } as never)
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

const counts = (store: Awaited<ReturnType<typeof load>>) => [
  store.getQueueProcessedCount(QUEUE),
  store.getQueueTotalCount(QUEUE),
]

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

describe('an upload the server refuses to start', () => {
  it('fails with the reason of the server on its row and in one alert', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    server.on('POST', /\/image\/licence\/1$/, () => {
      throw forbiddenOperationError('licence_manual_upload_disabled')
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(row.status).toBe('failed')
    expect(row.error).toEqual({
      hasError: true,
      message: 'This licence takes no manual uploads.',
      assetFileFailReason: 'none',
    })
    expect(row.canEditMetadata).toBe(false)
    expect([row.assetId, row.fileId]).toEqual([null, null])
    expect(showError.mock.calls).toEqual([['This licence takes no manual uploads.']])
    expect(counts(store)).toEqual([1, 1])
    expect(server.requests).toHaveLength(1)
  })

  it('says a reason once, however many files fail for it, and says another reason too', async () => {
    const store = await load()
    const rows = seedQueue(store, QUEUE, [waitingUpload(), waitingUpload(), waitingUpload(), waitingUpload()])
    let starts = 0
    server.on('POST', /\/image\/licence\/1$/, () => {
      starts++
      if (starts === 4) throw validationError({ mimeType: ['error_field_invalid'] })
      throw forbiddenOperationError('licence_manual_upload_disabled')
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(rows.map((row) => row.status)).toEqual(['failed', 'failed', 'failed', 'failed'])
    expect(rows.map((row) => row.error.message)).toEqual([
      'This licence takes no manual uploads.',
      'This licence takes no manual uploads.',
      'This licence takes no manual uploads.',
      'system.uploadErrors.mimeType',
    ])
    expect(showError.mock.calls).toEqual([['This licence takes no manual uploads.'], ['system.uploadErrors.mimeType']])
    expect(counts(store)).toEqual([4, 4])
  })

  it('says the reason again for a file added after the failed ones were taken out of the queue', async () => {
    const store = await load()
    seedQueue(store, QUEUE, [waitingUpload()])
    server.on('POST', /\/image\/licence\/1$/, () => {
      throw forbiddenOperationError('licence_manual_upload_disabled')
    })
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    store.stopUpload(QUEUE)
    store.addQueueItem(QUEUE, waitingUpload())
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(showError).toHaveBeenCalledTimes(2)
  })
})

describe('an upload whose start is answered without its file or its asset', () => {
  const answers: Array<[string, unknown]> = [
    ['no id', { asset: 'asset-1' }],
    ['no asset', { id: 'file-1' }],
    ['both as null', { id: null, asset: null }],
    ['neither', {}],
    ['no body at all', undefined],
  ]

  it.each(answers)('fails at once, as a start that was refused, and nothing more is sent: %s', async (_name, data) => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    server.on('POST', /\/image\/licence\/1$/, () => ({ status: 201, data }))

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(row.status).toBe('failed')
    expect(row.error).toEqual({
      hasError: true,
      message: 'system.uploadErrors.unknownError',
      assetFileFailReason: 'none',
    })
    expect(row.canEditMetadata).toBe(false)
    expect([row.assetId, row.fileId]).toEqual([null, null])
    expect(showError.mock.calls).toEqual([['system.uploadErrors.unknownError']])
    expect(counts(store)).toEqual([1, 1])
    expect(server.requests.map((request) => request.url)).toEqual(['/adm/v1/image/licence/1'])

    await vi.advanceTimersByTimeAsync(30 * 60_000)

    expect(server.requests).toHaveLength(1)
    expect(row.status).toBe('failed')
  })

  const types: Array<[DamAssetTypeType, string]> = [
    ['image', 'image/jpeg'],
    ['audio', 'audio/mpeg'],
    ['video', 'video/mp4'],
    ['document', 'application/pdf'],
  ]

  it.each(types)('is so for every type of file: %s', async (assetType, mimeType) => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [
      waitingUpload({ assetType, file: new File(['abc'], 'upload', { type: mimeType }) }),
    ])
    server.on('POST', new RegExp(`/${assetType}/licence/1$`), () => ({ status: 201, data: {} }))

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(EVERY_RETRY)

    expect(row.status).toBe('failed')
    expect(server.requests.map((request) => request.url)).toEqual([`/adm/v1/${assetType}/licence/1`])
  })

  it('is so for a file sent into a slot, whose row keeps the asset it was meant for', async () => {
    const store = await load()
    const [row] = seedQueue(store, 'slots', [
      waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }),
    ])
    server.on('POST', /\/image\/asset\/asset-9\/slot-name\/extra$/, () => ({ status: 201, data: { id: 'file-1' } }))

    store.processUpload('slots')
    await vi.advanceTimersByTimeAsync(EVERY_RETRY)

    expect([row.status, row.assetId, row.fileId]).toEqual(['failed', 'asset-9', null])
    expect(server.requests.map((request) => request.url)).toEqual(['/adm/v1/image/asset/asset-9/slot-name/extra'])
  })

  it('gives its place in the queue to the upload that waits', async () => {
    const store = await load()
    const rows = seedQueue(store, QUEUE, [waitingUpload(), waitingUpload(), waitingUpload()])
    let starts = 0
    server.on('POST', /\/image\/licence\/1$/, () => {
      starts++
      if (starts < 3) return { status: 201, data: {} }
      server.uploadStarted('image', 'asset-3', 'file-3')

      return { status: 201, data: { id: 'file-3', asset: 'asset-3' } }
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    // Fails at once. Chunks sent to a file with no name were refused try after try.
    // With both places of the queue held that long, the third file waited.
    expect(rows.map((row) => row.status)).toEqual(['failed', 'failed', 'processing'])
    expect(rows.map((row) => row.fileId)).toEqual([null, null, 'file-3'])
    expect(showError).toHaveBeenCalledTimes(1)
  })
})

describe('a chunk the server refuses', () => {
  it('is not sent again when the server says what is wrong with it', async () => {
    const store = await load()
    const [row, next] = seedQueue(store, QUEUE, [waitingUpload(), waitingUpload(), waitingUpload()])
    let chunks = 0
    server.on('POST', /\/image\/file-1\/chunk$/, () => {
      chunks++
      throw validationError({ size: ['error_field_invalid'] })
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(EVERY_RETRY)

    expect(chunks).toBe(1)
    expect(row.status).toBe('failed')
    expect(row.error).toEqual({ hasError: true, message: 'system.uploadErrors.size', assetFileFailReason: 'none' })
    expect(showError.mock.calls).toEqual([['system.uploadErrors.size']])
    expect(server.sent('PATCH', /\/image\/file-1\/uploaded$/)).toEqual([])
    expect([row.assetId, row.fileId]).toEqual(['asset-1', 'file-1'])
    expect(next.status).toBe('processing')
    expect(counts(store)).toEqual([1, 3])
  })

  it('is given up on after four attempts when nothing says why it fails', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    let chunks = 0
    server.on('POST', /\/image\/file-1\/chunk$/, () => {
      chunks++
      throw httpError(500)
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)
    expect([chunks, row.status]).toEqual([1, 'uploading'])
    await vi.advanceTimersByTimeAsync(EVERY_RETRY)

    expect(chunks).toBe(4)
    expect(row.status).toBe('failed')
    expect(row.error).toEqual({
      hasError: true,
      message: 'system.uploadErrors.unknownError',
      assetFileFailReason: 'none',
    })
    expect(showError.mock.calls).toEqual([['system.uploadErrors.unknownError']])
    expect(server.sent('PATCH', /\/uploaded$/)).toEqual([])
  })

  it('is given up on after four "bad request" answers that name no field, with the unknown error said once', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    // Records every text the row is given, not only the last.
    // A text written before the store's would be shown too.
    const { watch } = await import('vue')
    const texts: Array<string | undefined> = []
    const stopWatching = watch(
      () => store.getQueueItems(QUEUE)[0]?.error.message,
      (message) => texts.push(message),
      { flush: 'sync' }
    )
    let chunks = 0
    server.on('POST', /\/image\/file-1\/chunk$/, () => {
      chunks++
      throw httpError(400, { error: 'bad_request' })
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(EVERY_RETRY)
    stopWatching()

    expect(texts).toEqual(['system.uploadErrors.unknownError'])
    expect(chunks).toBe(4)
    expect(row.status).toBe('failed')
    expect(row.error).toEqual({
      hasError: true,
      message: 'system.uploadErrors.unknownError',
      assetFileFailReason: 'none',
    })
    expect(showError.mock.calls).toEqual([['system.uploadErrors.unknownError']])
    expect(server.sent('PATCH', /\/uploaded$/)).toEqual([])
  })

  it('goes through after all when a later attempt is answered', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    let chunks = 0
    server.on('POST', /\/image\/file-1\/chunk$/, () => {
      chunks++
      if (chunks < 3) throw httpError(500)

      return { status: 201, data: {} }
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(EVERY_RETRY)

    expect(chunks).toBe(3)
    expect(row.error.hasError).toBe(false)
    expect(server.sent('PATCH', /\/image\/file-1\/uploaded$/)).toHaveLength(1)
    expect(showError).not.toHaveBeenCalled()
  })
})

describe('a finish request that fails', () => {
  it('fails the row, and takes the form its metadata had enabled', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    server.on('PATCH', /\/image\/file-1\/uploaded$/, () => {
      row.canEditMetadata = true
      throw httpError(500)
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(row.status).toBe('failed')
    expect(row.error.message).toBe('system.uploadErrors.unknownError')
    // If it stayed editable, it would be validated and saved with the rest of the queue.
    expect(row.canEditMetadata).toBe(false)
    expect(showError).toHaveBeenCalledTimes(1)
    expect(counts(store)).toEqual([1, 1])
  })
})

describe('a failure of an upload the user has stopped', () => {
  it('changes nothing and says nothing', async () => {
    const store = await load()
    const [row, next] = seedQueue(store, QUEUE, [waitingUpload(), waitingUpload(), waitingUpload()])
    let abortedByStop: boolean | undefined = undefined
    server.on('POST', /\/image\/file-1\/chunk$/, async (request) => {
      await store.stopItemUpload(QUEUE, row)
      abortedByStop = request.config.signal?.aborted
      throw new Error('canceled')
    })
    server.asset(assetDetail('asset-1'))

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(EVERY_RETRY)

    expect(abortedByStop).toBe(true)
    expect(row.status).toBe('stop')
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
    expect(showError).not.toHaveBeenCalled()
    expect(store.getQueueItems(QUEUE)).not.toContain(row)
    expect(server.sent('POST', /\/image\/file-1\/chunk$/)).toHaveLength(1)
    expect(server.sent('PATCH', /\/image\/file-1\/uploaded$/)).toEqual([])
    expect(next.status).toBe('processing')
    expect(counts(store)).toEqual([0, 2])
  })
})
