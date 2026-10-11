import { AssetFileFailReason } from '@anzusystems/common-admin'
import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  assetDetail,
  createFakeDam,
  httpError,
  queueRow,
  seedDamConfig,
  seedQueue,
  stubFileReader,
  validationError,
} from '@/test/support/fakeDam'
import type { FakeDam, FakeDamRequest } from '@/test/support/fakeDam'

/* What the buttons around a queue do to it: stop everything, clear it, stop one row, take one row out, and write a
 * saved detail back into its rows - and how the queue runs an import next to its uploads. The real store, upload
 * service and API modules over a fake server. */

let server: FakeDam
const showUnknownError = vi.fn()
const showError = vi.fn()

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAlerts: () => ({ showError, showUnknownError }),
}))
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
const A_LONG_TIME = 30 * 60_000

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  // Two chunks to a file of 2000 bytes.
  seedDamConfig(useDamConfigStore(), 1024)
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

  return useUploadQueuesStore()
}

type Store = Awaited<ReturnType<typeof load>>

const waitingUpload = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({
    status: 'waiting',
    assetId: null,
    fileId: null,
    file: new File([new Uint8Array(2000)], 'photo.jpg', { type: 'image/jpeg' }),
    ...over,
  })

const waitingImport = (id: string) =>
  queueRow({
    type: 'externalProviderAsset',
    status: 'waiting',
    assetId: null,
    fileId: null,
    externalProviderAssetId: id,
    externalProviderName: 'unsplash',
  })

/** Three files in the queue: two with their first chunk on the wire, the third waiting for a place. */
const uploadsUnderWay = async (store: Store) => {
  const chunksOnTheWire: FakeDamRequest[] = []
  const heldAnswers: Array<() => void> = []
  let hold = true
  server.on('POST', /\/chunk$/, async (request) => {
    chunksOnTheWire.push(request)
    if (hold) await new Promise<void>((resolve) => heldAnswers.push(resolve))

    return { status: 201, data: {} }
  })
  const rows = seedQueue(store, QUEUE, [waitingUpload(), waitingUpload(), waitingUpload()])
  store.processUpload(QUEUE)
  await vi.advanceTimersByTimeAsync(0)
  expect(rows.map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting'])
  expect(chunksOnTheWire).toHaveLength(2)
  /** The server answers the chunks it was holding, and every chunk from now on. */
  const answerChunks = () => {
    hold = false
    heldAnswers.splice(0).forEach((answer) => answer())
  }

  return { rows, chunksOnTheWire, answerChunks }
}

const aborted = (requests: FakeDamRequest[]) => requests.map((request) => request.config.signal?.aborted)

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

describe('stopping a queue', () => {
  it('stops every row, aborts what is on the wire and empties the queue', async () => {
    const store = await load()
    const { rows, chunksOnTheWire, answerChunks } = await uploadsUnderWay(store)
    const keyBefore = store.getQueueFileInputKey(QUEUE)
    const requestsBefore = server.requests.length

    store.stopUpload(QUEUE)
    // The server did get the two chunks and answers them; nobody is waiting for that any more.
    answerChunks()
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(rows.map((row) => row.status)).toEqual(['stop', 'stop', 'stop'])
    expect(aborted(chunksOnTheWire)).toEqual([true, true])
    expect(store.getQueueItems(QUEUE)).toEqual([])
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([0, 0])
    // The file input is made anew, so that the same files can be picked again.
    expect(store.getQueueFileInputKey(QUEUE)).toBe(keyBefore + 2)
    // Nothing more is sent: no further chunk, no finish, and the third file never starts.
    expect(server.requests).toHaveLength(requestsBefore)
    expect(showError).not.toHaveBeenCalled()
  })

  it('does nothing to a queue that is empty or was never made', async () => {
    const store = await load()
    seedQueue(store, QUEUE, [])

    store.stopUpload(QUEUE)
    store.stopUpload('never-made')

    expect(store.getQueueFileInputKey(QUEUE)).toBe(0)
    expect(store.getQueue('never-made')).toBeNull()
  })

  it('leaves the other queues running', async () => {
    const store = await load()
    const { chunksOnTheWire } = await uploadsUnderWay(store)
    const [other] = seedQueue(store, 'slots', [queueRow({ type: 'slotFile', status: 'processing', slotName: 'extra' })])

    store.stopUpload('slots')

    expect(other.status).toBe('stop')
    expect(aborted(chunksOnTheWire)).toEqual([false, false])
    expect(store.getQueueItems(QUEUE).map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting'])
  })
})

describe('clearing a queue', () => {
  // What the mass-edit selection is emptied with: there is nothing in it to stop.
  it('empties it and makes its file input anew, without stopping anything', async () => {
    const store = await load()
    const rows = seedQueue(store, 'edit', [
      queueRow({ type: 'asset', status: 'uploaded', canEditMetadata: true }),
      queueRow({ type: 'asset', status: 'loading', assetId: 'asset-2' }),
    ])

    store.clearQueue('edit')

    expect(store.getQueueItems('edit')).toEqual([])
    expect([store.getQueueProcessedCount('edit'), store.getQueueTotalCount('edit')]).toEqual([0, 0])
    expect(store.getQueueFileInputKey('edit')).toBe(1)
    expect(rows.map((row) => row.status)).toEqual(['uploaded', 'loading'])
  })

  it('makes a queue that was not there', async () => {
    const store = await load()

    store.clearQueue('edit')

    expect(store.getQueue('edit')).toEqual({
      items: [],
      totalCount: 0,
      processedCount: 0,
      fileInputKey: 0,
      suggestions: { newKeywordNames: new Set(), newAuthorNames: new Set() },
    })
  })

  it('forgets the new names the queue had collected', async () => {
    const store = await load()
    seedQueue(store, 'edit', [queueRow({ type: 'asset', status: 'uploaded' })])
    store.queues.edit.suggestions.newAuthorNames.add('New Author')

    store.clearQueue('edit')

    expect(store.queues.edit.suggestions.newAuthorNames.size).toBe(0)
  })

  // An upload the queue held does not go on behind it: left going, it was sent to its end unseen and its asset stayed.
  it('stops the uploads it holds: their chunks are aborted, and nothing more is sent', async () => {
    const store = await load()
    const { rows, chunksOnTheWire, answerChunks } = await uploadsUnderWay(store)
    const keyBefore = store.getQueueFileInputKey(QUEUE)
    const requestsBefore = server.requests.length

    store.clearQueue(QUEUE)
    // The server did get the two chunks and answers them; nobody is waiting for that any more.
    answerChunks()
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(aborted(chunksOnTheWire)).toEqual([true, true])
    expect(rows.map((row) => row.status)).toEqual(['stop', 'stop', 'stop'])
    expect(store.getQueueItems(QUEUE)).toEqual([])
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([0, 0])
    // Cleared, not stopped: the file input is made anew once.
    expect(store.getQueueFileInputKey(QUEUE)).toBe(keyBefore + 1)
    // No further chunk, no finish, and the third file never starts.
    expect(server.requests).toHaveLength(requestsBefore)
    expect(showError).not.toHaveBeenCalled()
  })

  // A notification can fail a row before its file has been sent whole: its upload is stopped then and there, and
  // clearing the queue finds only the others to stop.
  it('stops an upload whose row a notification has failed while its file is still being sent', async () => {
    const store = await load()
    const { rows, chunksOnTheWire, answerChunks } = await uploadsUnderWay(store)
    store.queueItemFailed('asset-1', AssetFileFailReason.Unknown, 'file-1')
    await vi.advanceTimersByTimeAsync(0)
    // The chunk of the failed row is aborted at once, and the third file has started in its place.
    expect(rows.map((row) => row.status)).toEqual(['failed', 'uploading', 'uploading'])
    expect(chunksOnTheWire).toHaveLength(3)
    expect(aborted(chunksOnTheWire)).toEqual([true, false, false])
    const requestsBefore = server.requests.length

    store.clearQueue(QUEUE)
    answerChunks()
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(aborted(chunksOnTheWire)).toEqual([true, true, true])
    // The failed row stays as the server left it: it had no upload left to stop.
    expect(rows.map((row) => row.status)).toEqual(['failed', 'stop', 'stop'])
    // No second chunk of the failed row's file, and no finish.
    expect(server.requests).toHaveLength(requestsBefore)
  })

  it('stops an upload whose start request is still on the wire: no chunk follows the answer', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    let answerStart: () => void = () => undefined
    server.on('POST', /\/image\/licence\/1$/, async () => {
      await new Promise<void>((resolve) => (answerStart = resolve))

      return { status: 201, data: { id: 'file-1', asset: 'asset-1' } }
    })
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)
    expect(row.status).toBe('uploading')

    store.clearQueue(QUEUE)
    answerStart()
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(row.status).toBe('stop')
    expect(server.requests.map((request) => request.url)).toEqual(['/adm/v1/image/licence/1'])
    expect(showError).not.toHaveBeenCalled()
  })

  it('discards an import that is on the wire, whose answer it does not take, and leaves the other queues running', async () => {
    const store = await load()
    const { chunksOnTheWire } = await uploadsUnderWay(store)
    const [imported] = seedQueue(store, 'imports', [waitingImport('photo-9')])
    let answerImport: () => void = () => undefined
    server.on('POST', /\/image\/licence\/1\/external-provider$/, async () => {
      await new Promise<void>((resolve) => (answerImport = resolve))

      return { status: 201, data: { id: 'file-9', asset: 'asset-9' } }
    })
    store.processUpload('imports')
    await vi.advanceTimersByTimeAsync(0)
    expect(imported.status).toBe('uploading')

    store.clearQueue('imports')
    answerImport()
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    // The import was made on the server, and its row is gone: it takes nothing of the answer.
    expect(imported.status).toBe('stop')
    expect([imported.assetId, imported.fileId]).toEqual([null, null])
    // Nor is its asset read; it was not before the queue stopped its rows either, a row of no queue being asked about by nobody.
    expect(server.assetReads('asset-9')).toBe(0)
    expect(aborted(chunksOnTheWire)).toEqual([false, false])
    expect(store.getQueueItems(QUEUE).map((row) => row.status)).toEqual(['uploading', 'uploading', 'waiting'])
  })
})

describe('an import whose answer comes after its queue was stopped or cleared', () => {
  const ways = ['clearQueue', 'stopUpload'] as const
  const answers: Array<[string, unknown]> = [
    ['names neither its file nor its asset', {}],
    ['is as it should be', { id: 'file-9', asset: 'asset-9' }],
  ]
  const cases = ways.flatMap((way) => answers.map(([name, data]) => [way, name, data] as const))

  it.each(cases)(
    'leaves the discarded row as it is and says nothing: %s, an answer that %s',
    async (way, _name, data) => {
      const store = await load()
      const [imported] = seedQueue(store, QUEUE, [waitingImport('photo-9')])
      let answerImport: () => void = () => undefined
      server.on('POST', /\/external-provider$/, async () => {
        await new Promise<void>((resolve) => (answerImport = resolve))

        return { status: 201, data }
      })
      store.processUpload(QUEUE)
      await vi.advanceTimersByTimeAsync(0)
      expect(imported.status).toBe('uploading')

      store[way](QUEUE)
      answerImport()
      await vi.advanceTimersByTimeAsync(A_LONG_TIME)

      expect([imported.status, imported.assetId, imported.fileId]).toEqual(['stop', null, null])
      expect(imported.error.hasError).toBe(false)
      expect(showUnknownError).not.toHaveBeenCalled()
      expect(server.requests).toHaveLength(1)
    }
  )

  // Nor when the server refuses it: the row was discarded before the refusal came, and nobody sees it any more.
  const refusals: Array<[string, () => Error]> = [
    ['an error of the server', () => httpError(500)],
    ['the provider asset is in the licence already', () => validationError({ id: ['error_field_not_unique'] })],
  ]
  const refusedCases = ways.flatMap((way) => refusals.map(([name, refusal]) => [way, name, refusal] as const))

  it.each(refusedCases)(
    'leaves the discarded row as it is and says nothing: %s, a refusal: %s',
    async (way, _name, refusal) => {
      const store = await load()
      const [imported] = seedQueue(store, QUEUE, [waitingImport('photo-9')])
      let refuseImport: () => void = () => undefined
      server.on('POST', /\/external-provider$/, async () => {
        await new Promise<void>((resolve) => (refuseImport = resolve))

        throw refusal()
      })
      store.processUpload(QUEUE)
      await vi.advanceTimersByTimeAsync(0)
      expect(imported.status).toBe('uploading')

      store[way](QUEUE)
      refuseImport()
      await vi.advanceTimersByTimeAsync(A_LONG_TIME)

      expect([imported.status, imported.error.hasError, imported.isDuplicate]).toEqual(['stop', false, false])
      expect(showUnknownError).not.toHaveBeenCalled()
      expect(server.requests).toHaveLength(1)
    }
  )
})

describe('stopping one row', () => {
  it('aborts its chunk, takes it out and starts the row that waited', async () => {
    const store = await load()
    const { rows, chunksOnTheWire, answerChunks } = await uploadsUnderWay(store)

    await store.stopItemUpload(QUEUE, rows[0])
    await vi.advanceTimersByTimeAsync(0)

    expect(rows[0].status).toBe('stop')
    expect(aborted(chunksOnTheWire)).toEqual([true, false, false])
    expect(store.getQueueItems(QUEUE)).toEqual([rows[1], rows[2]])
    expect(rows.map((row) => row.status)).toEqual(['stop', 'uploading', 'uploading'])
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([0, 2])

    // The server answers every chunk, the one of the stopped file too.
    answerChunks()
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    // Its upload is not taken up again: no second chunk of its file, no finish - while the other two go through.
    expect(server.sent('POST', /\/image\/file-1\/chunk$/)).toHaveLength(1)
    expect(server.sent('PATCH', /\/image\/file-1\/uploaded$/)).toEqual([])
    expect(rows.map((row) => row.status)).toEqual(['stop', 'processing', 'processing'])
    expect(server.sent('PATCH', /\/uploaded$/)).toHaveLength(2)
    expect(showError).not.toHaveBeenCalled()
  })

  // Its Cancel, while its request is on the wire: the row is gone, and the refusal that comes after says nothing.
  it('takes out an import whose request is on the wire, and says nothing of a refusal that comes after', async () => {
    const store = await load()
    const [imported] = seedQueue(store, QUEUE, [waitingImport('photo-9')])
    let refuseImport: () => void = () => undefined
    server.on('POST', /\/external-provider$/, async () => {
      await new Promise<void>((resolve) => (refuseImport = resolve))

      throw httpError(500)
    })
    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)
    expect(imported.status).toBe('uploading')

    await store.stopItemUpload(QUEUE, imported)
    refuseImport()
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(store.getQueueItems(QUEUE)).toEqual([])
    expect([imported.status, imported.error.hasError]).toEqual(['stop', false])
    expect(showUnknownError).not.toHaveBeenCalled()
    expect(server.requests).toHaveLength(1)
  })

  it('takes out a row that was only waiting, which is then never started', async () => {
    const store = await load()
    const { rows, answerChunks } = await uploadsUnderWay(store)

    await store.stopItemUpload(QUEUE, rows[2])
    // Both places free: the two files that were being sent go through, and the queue looks for what waits.
    answerChunks()
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(rows.map((row) => row.status)).toEqual(['processing', 'processing', 'stop'])
    expect(store.getQueueItems(QUEUE)).toEqual([rows[0], rows[1]])
    expect(server.sent('POST', /\/image\/licence\/1$/)).toHaveLength(2)
    expect(server.sent('PATCH', /\/uploaded$/)).toHaveLength(2)
  })
})

/* A stop that comes while a request of the upload is on the wire, or between two of them. The abort signal reaches
 * only a chunk on the wire - and the server may answer that chunk all the same; the start request carries no signal,
 * and between two chunks there is nothing to abort. */
describe('a stop that comes in the middle of an upload', () => {
  it('sends no further chunk and no finish although the server answers the chunk that was on the wire', async () => {
    const store = await load()
    const rows = seedQueue(store, QUEUE, [waitingUpload(), waitingUpload(), waitingUpload()])
    let abortedByTheStop: boolean | undefined = undefined
    server.on('POST', /\/image\/file-1\/chunk$/, async (request) => {
      await store.stopItemUpload(QUEUE, rows[0])
      abortedByTheStop = request.config.signal?.aborted

      return { status: 201, data: {} }
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(abortedByTheStop).toBe(true)
    expect(server.sent('POST', /\/image\/file-1\/chunk$/)).toHaveLength(1)
    expect(server.sent('PATCH', /\/image\/file-1\/uploaded$/)).toEqual([])
    // The other two files, the one that waited among them, are sent whole.
    expect(rows.map((row) => row.status)).toEqual(['stop', 'processing', 'processing'])
    expect(store.getQueueItems(QUEUE)).toEqual([rows[1], rows[2]])
    expect(server.sent('PATCH', /\/uploaded$/)).toHaveLength(2)
    expect(showError).not.toHaveBeenCalled()
  })

  it('sends nothing more at all when the whole queue is stopped during a chunk the server then answers', async () => {
    const store = await load()
    const rows = seedQueue(store, QUEUE, [waitingUpload(), waitingUpload(), waitingUpload()])
    let sentByTheStop = -1
    server.on('POST', /\/image\/file-1\/chunk$/, () => {
      store.stopUpload(QUEUE)
      sentByTheStop = server.requests.length

      return { status: 201, data: {} }
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(sentByTheStop).toBeGreaterThan(0)
    // Not a chunk of the second file either, wherever between its requests the stop found it.
    expect(server.requests).toHaveLength(sentByTheStop)
    expect(server.sent('PATCH')).toEqual([])
    expect(rows.map((row) => row.status)).toEqual(['stop', 'stop', 'stop'])
    expect(store.getQueueItems(QUEUE)).toEqual([])
    expect(showError).not.toHaveBeenCalled()
  })

  // Too late to abort: the answer is in, and only the stop itself can keep the next request from going out.
  it('sends no further chunk when it comes just as the answer to a chunk arrives', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    server.on('POST', /\/image\/file-1\/chunk$/, () => ({
      status: 201,
      data: {},
      arrived: () => void store.stopItemUpload(QUEUE, row),
    }))

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    // The first of its two chunks was sent and answered; the second never goes out.
    expect(server.sent('POST', /\/image\/file-1\/chunk$/)).toHaveLength(1)
    expect(server.sent('PATCH')).toEqual([])
    expect(row.status).toBe('stop')
    expect(store.getQueueItems(QUEUE)).toEqual([])
    expect(showError).not.toHaveBeenCalled()
  })

  it('sends no finish when it comes just as the answer to the last chunk arrives', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    let chunks = 0
    server.on('POST', /\/image\/file-1\/chunk$/, () => {
      const last = ++chunks === 2

      return { status: 201, data: {}, arrived: () => void (last && store.stopItemUpload(QUEUE, row)) }
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    // Every byte is on the server, and the file is never declared complete.
    expect(server.sent('POST', /\/image\/file-1\/chunk$/)).toHaveLength(2)
    expect(server.sent('PATCH')).toEqual([])
    expect(row.status).toBe('stop')
    expect(store.getQueueItems(QUEUE)).toEqual([])
    expect(showError).not.toHaveBeenCalled()
  })

  // The start request carries no signal: the server makes the asset and answers, and only then is the stop seen.
  it('sends no chunk and no finish when it comes while the start request is on the wire', async () => {
    const store = await load()
    const rows = seedQueue(store, QUEUE, [waitingUpload(), waitingUpload(), waitingUpload()])
    let starts = 0
    server.on('POST', /\/image\/licence\/1$/, async () => {
      const started = ++starts
      if (started === 1) await store.stopItemUpload(QUEUE, rows[0])
      server.uploadStarted('image', 'asset-' + started, 'file-' + started)

      return { status: 201, data: { id: 'file-' + started, asset: 'asset-' + started } }
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(server.sent('POST', /\/image\/file-1\/chunk$/)).toEqual([])
    expect(server.sent('PATCH', /\/image\/file-1\/uploaded$/)).toEqual([])
    // The asset the request made stays on the server: the row has its ids, and nothing is taken back.
    expect([rows[0].status, rows[0].assetId, rows[0].fileId]).toEqual(['stop', 'asset-1', 'file-1'])
    expect(server.sent('DELETE')).toEqual([])
    expect(rows.map((row) => row.status)).toEqual(['stop', 'processing', 'processing'])
    expect(store.getQueueItems(QUEUE)).toEqual([rows[1], rows[2]])
    expect(showError).not.toHaveBeenCalled()
  })

  it('sends no further chunk and no finish when it comes while the next chunk is read off the disk', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload()])
    let reads = 0
    stubFileReader(() => {
      // The first chunk has been answered; the second is only being read, with nothing on the wire.
      if (++reads === 2) void store.stopItemUpload(QUEUE, row)
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect(reads).toBe(2)
    expect(server.sent('POST', /\/image\/file-1\/chunk$/)).toHaveLength(1)
    expect(server.sent('PATCH')).toEqual([])
    expect(row.status).toBe('stop')
    expect(store.getQueueItems(QUEUE)).toEqual([])
    expect(showError).not.toHaveBeenCalled()
  })
})

describe('taking a row out by its asset', () => {
  // The trash button of a row: the asset is deleted first, and the row may still be uploading into it.
  it('stops its upload as a cancel would, and starts the row that waited', async () => {
    const store = await load()
    const { rows, chunksOnTheWire } = await uploadsUnderWay(store)

    await store.removeByAssetId(QUEUE, 'asset-2')
    await vi.advanceTimersByTimeAsync(0)

    expect(rows[1].status).toBe('stop')
    expect(aborted(chunksOnTheWire)).toEqual([false, true, false])
    expect(store.getQueueItems(QUEUE)).toEqual([rows[0], rows[2]])
    expect(rows[2].status).toBe('uploading')
  })

  it('takes out a settled row and counts the queue again', async () => {
    const store = await load()
    const rows = seedQueue(store, QUEUE, [
      queueRow({ status: 'uploaded', canEditMetadata: true }),
      queueRow({ status: 'failed', assetId: 'asset-2' }),
    ])
    store.recalculateQueueCounts(QUEUE)
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([2, 2])

    await store.removeByAssetId(QUEUE, 'asset-1')

    expect(store.getQueueItems(QUEUE)).toEqual([rows[1]])
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 1])
    // Nothing is asked of the server: the row is only a row.
    expect(server.requests).toEqual([])
  })

  it('does nothing for an asset the queue does not hold', async () => {
    const store = await load()
    const rows = seedQueue(store, QUEUE, [queueRow({ status: 'uploaded' })])

    await store.removeByAssetId(QUEUE, 'asset-9')
    await store.removeByAssetId('never-made', 'asset-1')

    expect(store.getQueueItems(QUEUE)).toEqual(rows)
  })
})

describe('a detail of an asset that was saved', () => {
  it('is written back into every row of that asset, in every queue, with no request', async () => {
    const store = await load()
    const [upload, another] = seedQueue(store, QUEUE, [
      queueRow({ status: 'uploaded', canEditMetadata: true, keywords: ['old'], customData: { title: 'old' } }),
      queueRow({ status: 'uploaded', assetId: 'asset-2', keywords: ['other'] }),
    ])
    const [picked] = seedQueue(store, 'edit', [
      queueRow({ type: 'asset', status: 'uploaded', mainFileSingleUse: false }),
    ])

    store.updateAssetMetadata(
      assetDetail('asset-1', {
        keywords: ['saved-keyword'],
        authors: ['saved-author'],
        mainFileSingleUse: true,
        metadata: { customData: { title: 'saved' }, authorSuggestions: {}, keywordSuggestions: {} },
      }) as never
    )

    for (const row of [upload, picked]) {
      expect([row.keywords, row.authors, row.customData]).toEqual([
        ['saved-keyword'],
        ['saved-author'],
        { title: 'saved' },
      ])
      // The switch too: it is a field of the detail and of the row alike.
      expect(row.mainFileSingleUse).toBe(true)
    }
    expect(another.keywords).toEqual(['other'])
    // The rest of the row is not the detail's to say.
    expect([upload.status, upload.canEditMetadata, picked.canEditMetadata]).toEqual(['uploaded', true, false])
    expect(server.requests).toEqual([])
  })
})

describe('an import from an external provider in the queue', () => {
  it('is one request, takes a place while it is on the wire and gives it to the next row when answered', async () => {
    const store = await load()
    let answerImport: () => void = () => undefined
    server.on('POST', /\/external-provider$/, async () => {
      await new Promise<void>((resolve) => (answerImport = resolve))

      return { status: 201, data: { id: 'file-import', asset: 'asset-import' } }
    })
    server.on('POST', /\/chunk$/, () => new Promise(() => undefined))
    const [imported, first, second] = seedQueue(store, QUEUE, [
      waitingImport('photo-9'),
      waitingUpload(),
      waitingUpload(),
    ])

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect([imported.status, first.status, second.status]).toEqual(['uploading', 'uploading', 'waiting'])
    expect(server.sent('POST', /\/image\/licence\/1\/external-provider$/)).toHaveLength(1)

    answerImport()
    await vi.advanceTimersByTimeAsync(0)

    // No start, no chunk and no finish of its own: the server fetches the file from the provider.
    expect([imported.status, imported.assetId, imported.fileId]).toEqual(['processing', 'asset-import', 'file-import'])
    expect(server.requests.filter((request) => request.url.includes('file-import'))).toEqual([])
    expect(second.status).toBe('uploading')
  })

  it('fails as a duplicate, with nothing said, when the provider asset is in the licence already', async () => {
    const store = await load()
    const [imported, next] = seedQueue(store, QUEUE, [waitingImport('photo-9'), waitingImport('photo-10')])
    server.on('POST', /\/external-provider$/, (request) => {
      if (JSON.parse(request.data as string).id === 'photo-9') throw validationError({ id: ['error_field_not_unique'] })

      return { status: 201, data: { id: 'file-2', asset: 'asset-2' } }
    })

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect([imported.status, imported.isDuplicate, imported.error.hasError]).toEqual(['failed', true, false])
    expect([imported.assetId, imported.fileId]).toEqual([null, null])
    expect(showUnknownError).not.toHaveBeenCalled()
    expect(next.status).toBe('processing')
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 2])
  })

  it('fails with the unknown-error alert for any other refusal, and is never asked about', async () => {
    const store = await load()
    server.on('POST', /\/external-provider$/, () => {
      throw httpError(500)
    })
    const [imported] = seedQueue(store, QUEUE, [waitingImport('photo-9')])

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(A_LONG_TIME)

    expect([imported.status, imported.isDuplicate]).toEqual(['failed', false])
    expect(imported.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'none' })
    expect(showUnknownError).toHaveBeenCalledTimes(1)
    expect(server.sent('GET')).toEqual([])
  })

  const answersWithoutIds: Array<[string, unknown]> = [
    ['neither', {}],
    ['no asset', { id: 'file-1' }],
    ['no id', { asset: 'asset-1' }],
    ['no body at all', undefined],
  ]

  it.each(answersWithoutIds)(
    'fails as a refused import does when the answer does not name its file and its asset: %s',
    async (_name, data) => {
      const store = await load()
      server.on('POST', /\/external-provider$/, () => ({ status: 201, data }))
      const [imported] = seedQueue(store, QUEUE, [waitingImport('photo-9')])

      store.processUpload(QUEUE)
      await vi.advanceTimersByTimeAsync(0)

      expect([imported.status, imported.isDuplicate]).toEqual(['failed', false])
      expect(imported.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'none' })
      // Nothing of the answer is taken for the row.
      expect([imported.assetId, imported.fileId]).toEqual([null, null])
      expect(showUnknownError).toHaveBeenCalledTimes(1)
      expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 1])
      expect(server.requests.map((request) => request.url)).toEqual(['/adm/v1/image/licence/1/external-provider'])

      await vi.advanceTimersByTimeAsync(A_LONG_TIME)

      // Not handed over to the poll, which would ask about an asset it has no id of.
      expect(server.requests).toHaveLength(1)
      expect(showUnknownError).toHaveBeenCalledTimes(1)
    }
  )

  // Its place was free either way, an import being one request: what is new is that it fails, and says so once.
  it('fails only the import answered without its ids, and the imports that wait go on', async () => {
    const store = await load()
    server.on('POST', /\/external-provider$/, (request) => {
      const id = JSON.parse(request.data as string).id
      if (id === 'photo-1') return { status: 201, data: {} }
      server.uploadStarted('image', 'asset-' + id, 'file-' + id)

      return { status: 201, data: { id: 'file-' + id, asset: 'asset-' + id } }
    })
    const rows = seedQueue(store, QUEUE, [waitingImport('photo-1'), waitingImport('photo-2'), waitingImport('photo-3')])

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(rows.map((row) => row.status)).toEqual(['failed', 'processing', 'processing'])
    expect(rows.map((row) => row.fileId)).toEqual([null, 'file-photo-2', 'file-photo-3'])
    expect(showUnknownError).toHaveBeenCalledTimes(1)
  })
})
