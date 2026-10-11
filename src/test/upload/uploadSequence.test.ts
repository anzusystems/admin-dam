import { createHash } from 'node:crypto'

import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam, queueRow, seedDamConfig, seedQueue, stubFileReader } from '@/test/support/fakeDam'
import type { FakeDam, FakeDamRequest } from '@/test/support/fakeDam'

/* One file from the queue to the server, request by request: what is sent, in which order, and what the row says
 * meanwhile. The real store, upload service and API modules over a fake server; chunks of 1024 bytes. */

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
const CHUNK = 1024

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore(), CHUNK)
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

  return useUploadQueuesStore()
}

const bytesOf = (length: number) => Uint8Array.from({ length }, (_value, index) => index % 251)
const sha1 = (bytes: Uint8Array<ArrayBuffer>) => createHash('sha1').update(bytes).digest('hex')

const waitingUpload = (bytes: Uint8Array<ArrayBuffer>, over: Partial<UploadQueueItem> = {}) =>
  queueRow({
    status: 'waiting',
    assetId: null,
    fileId: null,
    file: new File([bytes], 'photo.jpg', { type: 'image/jpeg' }),
    ...over,
  })

const chunkOf = (request: FakeDamRequest) => {
  const form = request.data as FormData

  return { ...JSON.parse(form.get('chunk') as string), bytes: (form.get('file') as File).size }
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

describe('the upload of a file larger than one chunk', () => {
  it('starts, sends the chunks one after another and finishes with the checksum of the file', async () => {
    const store = await load()
    const bytes = bytesOf(2500)
    const [row] = seedQueue(store, QUEUE, [waitingUpload(bytes)])

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(server.requests.map((request) => [request.method, request.url])).toEqual([
      ['POST', '/adm/v1/image/licence/1'],
      ['POST', '/adm/v1/image/file-1/chunk'],
      ['POST', '/adm/v1/image/file-1/chunk'],
      ['POST', '/adm/v1/image/file-1/chunk'],
      ['PATCH', '/adm/v1/image/file-1/uploaded'],
    ])
    expect(JSON.parse(server.requests[0].data as string)).toEqual({ mimeType: 'image/jpeg', size: 2500 })
    // Each chunk says where in the file it belongs; the last one is what was left.
    expect(server.sent('POST', /\/chunk$/).map(chunkOf)).toEqual([
      { offset: 0, size: CHUNK, bytes: CHUNK },
      { offset: 1024, size: CHUNK, bytes: CHUNK },
      { offset: 2048, size: 452, bytes: 452 },
    ])
    // A sha1 over the bytes in the order they were sent.
    expect(JSON.parse(server.requests[4].data as string)).toEqual({ checksum: sha1(bytes) })
    // The ids are the ones the start request answered with, and from the finish on the server works on the file.
    expect([row.assetId, row.fileId, row.status]).toEqual(['asset-1', 'file-1', 'processing'])
    expect(showError).not.toHaveBeenCalled()
  })

  it('names every chunk after the file and gives each the signal Stop aborts', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload(bytesOf(2500))])

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    const chunks = server.sent('POST', /\/chunk$/)
    expect(chunks.map((request) => ((request.data as FormData).get('file') as File).name)).toEqual([
      'photo.jpg',
      'photo.jpg',
      'photo.jpg',
    ])
    // One controller per chunk: the row holds the one of the chunk sent last.
    expect(chunks[2].config.signal).toBe(row.latestChunkAbortController?.signal)
    expect(new Set(chunks.map((request) => request.config.signal)).size).toBe(3)
  })
})

describe('the progress of an upload on its row', () => {
  /** A server whose chunks report what they have sent, one second apart, and can be held open. */
  const reportingServer = () => {
    const held: Array<() => void> = []
    let hold = false
    server.on('POST', /\/chunk$/, async (request) => {
      request.config.onUploadProgress?.({ loaded: 1, total: CHUNK } as never)
      vi.setSystemTime(Date.now() + 1000)
      request.config.onUploadProgress?.({ loaded: 501, total: CHUNK } as never)
      if (hold) await new Promise<void>((resolve) => held.push(resolve))

      return { status: 201, data: {} }
    })

    return {
      holdChunks: () => (hold = true),
      release: () => {
        hold = false
        held.splice(0).forEach((resolve) => resolve())
      },
    }
  }

  it('says how far the file is, how fast it goes and how long is left, a chunk at a time', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload(bytesOf(2500))])
    const chunks = reportingServer()
    chunks.holdChunks()

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(1500)

    // The first chunk is still on the wire: what it has sent of itself counts already.
    expect(row.status).toBe('uploading')
    expect(row.progress.progressPercent).toBeCloseTo((501 / 2500) * 100)
    // Its 501 bytes over the two seconds since the chunk was sent: the second of its two reports, and the second
    // that has passed since with nothing more.
    expect(row.progress.speed).toBe(251)
    expect(row.progress.remainingTime).toBe(8)

    chunks.release()
    chunks.holdChunks()
    await vi.advanceTimersByTimeAsync(1500)

    // The first chunk whole and what the second has sent of itself.
    expect(row.progress.progressPercent).toBeCloseTo(((1024 + 501) / 2500) * 100)
    // One measure across the chunks: those 1525 bytes over the four seconds from the request of the first chunk to
    // the second that saw the last of them, the time the server took to answer the first chunk among them. The
    // second after it has nothing new of a chunk that is half on its way and says nothing: the row keeps its values.
    expect(row.progress.speed).toBe(382)
    expect(row.progress.remainingTime).toBe(3)
  })

  it('says the whole file is sent while the finish request is on the wire', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload(bytesOf(2500))])
    reportingServer()
    server.on('PATCH', /\/uploaded$/, () => new Promise(() => undefined))

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(1500)

    expect(row.status).toBe('uploading')
    expect(row.progress.progressPercent).toBe(100)
    expect(row.progress.remainingTime).toBe(0)
    expect(row.progress.speed).toBeGreaterThan(0)
  })

  // The chunks of the fake server are answered in the millisecond they are sent in: a measure needs time to pass.
  it('says nothing about speed where no time passes', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload(bytesOf(2500))])
    server.on('PATCH', /\/uploaded$/, () => new Promise(() => undefined))

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(5000)

    expect(row.progress).toEqual({ remainingTime: null, progressPercent: null, speed: null })
  })
})

describe('the upload of a file with nothing in it', () => {
  // The server is asked to make a file of no bytes, and told it is complete.
  it('is started and finished with no chunk between', async () => {
    const store = await load()
    const [row] = seedQueue(store, QUEUE, [waitingUpload(bytesOf(0))])

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(server.requests.map((request) => [request.method, request.url])).toEqual([
      ['POST', '/adm/v1/image/licence/1'],
      ['PATCH', '/adm/v1/image/file-1/uploaded'],
    ])
    expect(JSON.parse(server.requests[0].data as string)).toEqual({ mimeType: 'image/jpeg', size: 0 })
    expect(JSON.parse(server.requests[1].data as string)).toEqual({
      checksum: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
    })
    expect(row.status).toBe('processing')
  })
})

describe('a row that has no file to send', () => {
  it('fails without a request, and frees its place for the next one', async () => {
    const store = await load()
    const [broken, next] = seedQueue(store, QUEUE, [
      waitingUpload(bytesOf(3), { file: null }),
      waitingUpload(bytesOf(3)),
      waitingUpload(bytesOf(3)),
      waitingUpload(bytesOf(3)),
    ])

    store.processUpload(QUEUE)
    await vi.advanceTimersByTimeAsync(0)

    expect(broken.status).toBe('failed')
    expect(broken.error).toEqual({
      hasError: true,
      message: 'system.uploadErrors.unknownError',
      assetFileFailReason: 'none',
    })
    expect(broken.assetId).toBeNull()
    expect(showError).toHaveBeenCalledTimes(1)
    expect(showError).toHaveBeenCalledWith('system.uploadErrors.unknownError')
    // The other three went through, two at a time.
    expect(next.status).toBe('processing')
    expect(server.sent('POST', /\/image\/licence\/1$/)).toHaveLength(3)
    expect([store.getQueueProcessedCount(QUEUE), store.getQueueTotalCount(QUEUE)]).toEqual([1, 4])
  })
})
