import type { CommonAdminCoreDamOptions, UploadQueueItem } from '@anzusystems/common-admin'
import { AxiosError } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

import {
  assetDetail,
  assetFile,
  createFakeDam,
  httpError,
  queueRow,
  seedDamConfig,
  seedQueue,
  stubFileReader,
  validationError,
} from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'
import { recordingScheduler } from '@/test/support/recordingScheduler'

/* The poll of the upload queue as the application wires it: the plugin installed with what `config.json` says
 * of the notification service, the listeners of the application added as at its start, the real store and
 * upload. The server is a fake, and so is the socket: a stand-in for the global `WebSocket`.
 *
 * The file keeps the name of what it replaced: the fallback each row once armed for itself is gone, and one poll
 * per queue asks in its place - as the only channel where the service is not configured, and beside the
 * notifications where it is. The rhythm itself is the library's, and pinned there. */

let server: FakeDam

// The library is not replaced, not even in part: a replaced library is one instance for the whole file, and the
// plugin options, the socket and the listeners of one case would be those of the next.
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

const sockets: FakeSocket[] = []

class FakeSocket {
  readyState = 0
  onopen: (() => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null
  onerror: (() => void) | null = null
  onmessage: ((event: { data: string }) => void) | null = null

  constructor(public url: string) {
    sockets.push(this)
  }

  send() {}

  close() {
    this.drops()
  }

  /** The connection is made. */
  opens() {
    this.readyState = 1
    this.onopen?.()
  }

  /** The connection is lost. */
  drops() {
    this.readyState = 3
    this.onclose?.({ code: 1006 })
  }

  /** A notification as the service sends it: the data as a text inside the message. */
  says(eventName: string, data: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify({ eventName, data: JSON.stringify(data) }) })
  }
}

const GLOBAL = 'global'
const SLOTS = 'slots'
const EDIT = 'edit'
const SECOND = 1000
const MINUTE = 60 * SECOND
const SOCKET_URL = 'wss://notifications.test/ws'

type NotificationConfig = NonNullable<CommonAdminCoreDamOptions>['notification']

// The timers the queues hold, apart from every other timer of the application.
let queueTimers: ReturnType<typeof recordingScheduler>

/** The application started with this in the `notification` block of its config, or with no such block. */
const start = async (notification?: NotificationConfig) => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { AnzuSystemsCommonAdmin, uploadSettlementRuntime, useDamConfigStore } =
    await import('@anzusystems/common-admin')
  queueTimers = recordingScheduler()
  uploadSettlementRuntime.scheduler = queueTimers
  seedDamConfig(useDamConfigStore())
  const { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, i18n } = await import('@/plugins/i18n')
  const { damClient } = await import('@/shared/apiClients/damClient')
  createApp({ setup: () => () => null }).use(AnzuSystemsCommonAdmin, {
    i18n,
    languages: { available: AVAILABLE_LANGUAGES, default: DEFAULT_LANGUAGE },
    coreDam: {
      configs: { default: { damClient } },
      apiTimeout: 30,
      adminDomain: 'https://dam.test',
      ...(notification ? { notification } : {}),
    },
  })
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

  return useUploadQueuesStore()
}

type Store = Awaited<ReturnType<typeof start>>

const waitingUpload = (over: Partial<UploadQueueItem> = {}) =>
  queueRow({
    status: 'waiting',
    assetId: null,
    fileId: null,
    file: new File(['abc'], 'photo.jpg', { type: 'image/jpeg' }),
    ...over,
  })

/** The rows are sent whole: each waits for the server from this moment, the first as `asset-1` with `file-1`. */
const sent = async (store: Store, queueId: string, rows: UploadQueueItem[]) => {
  const seeded = seedQueue(store, queueId, rows)
  store.processUpload(queueId)
  await vi.advanceTimersByTimeAsync(0)
  seeded.forEach((row) => expect(row.status).toBe('processing'))

  return seeded
}

/** The tab as the queues ask about it: visible, and counting who listens for it to change. Before the first row. */
const watchedTab = async () => {
  const { uploadSettlementRuntime } = await import('@anzusystems/common-admin')
  let listeners = 0
  uploadSettlementRuntime.visibility = {
    isVisible: () => true,
    onChange: () => {
      listeners++

      return () => {
        listeners--
      }
    },
  }

  return { listeners: () => listeners }
}

/** What the api error logger of the application is handed from now on: the address and the status of each. */
const loggedFailures = async () => {
  const { setApiErrorLogger } = await import('@anzusystems/common-admin')
  const logged: Array<{ url: string | undefined; status: number | undefined }> = []
  setApiErrorLogger((_error, context) => {
    logged.push({ url: context.url, status: context.status })
  })

  return logged
}

const assetReadUrls = () =>
  server
    .sent('GET', /^\/adm\/v1\/asset\//)
    .map((request) => request.url)
    .join(' ')

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  stubFileReader()
  sockets.length = 0
  vi.stubGlobal('WebSocket', FakeSocket)
  server = createFakeDam()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const noService: Array<[string, NotificationConfig | undefined]> = [
  ['says nothing of the service', undefined],
  ['has the service off', { enabled: false, webSocketUrl: SOCKET_URL }],
  // A deployment template puts the value in quotes: a text, and not the text that switches the service on.
  ['has the service off as a text', { enabled: 'false', webSocketUrl: SOCKET_URL }],
  ['has the service on and gives it no address', { enabled: true, webSocketUrl: '' }],
  ['has an empty block for the service', {}],
]

describe.each(noService)('an application whose config %s', (_name, notification) => {
  it('starts, opens no socket, and settles an upload by the read that comes five seconds after it was sent', async () => {
    const store = await start(notification)
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    expect(sockets).toEqual([])
    // The file of the row is known before the poll first asks: a read names the main file of the asset, and a row
    // without its file would not answer to it.
    expect([row.assetId, row.fileId]).toEqual(['asset-1', 'file-1'])
    server.asset(assetDetail('asset-1', { mainFileSingleUse: true }))

    await vi.advanceTimersByTimeAsync(5 * SECOND - 1)
    expect(server.assetReads('asset-1')).toBe(0)
    await vi.advanceTimersByTimeAsync(1)

    expect(server.assetReads('asset-1')).toBe(1)
    expect([row.status, row.assetStatus, row.canEditMetadata]).toEqual(['uploaded', 'with_file', true])
    expect([row.keywords, row.customData, row.mainFileSingleUse]).toEqual([
      ['keyword-server'],
      { title: 'from the server' },
      true,
    ])
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })

    await vi.advanceTimersByTimeAsync(60 * MINUTE)

    // One read was all it took, and nothing is asked once the queue has nothing waiting.
    expect(server.assetReads('asset-1')).toBe(1)
    expect(sockets).toEqual([])
  })
})

describe('an application without the notification service', () => {
  it('settles a file uploaded into a slot from the list of the slots of its asset', async () => {
    const store = await start()
    const [row] = await sent(store, SLOTS, [waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' })])
    expect([row.assetId, row.fileId]).toEqual(['asset-9', 'file-1'])
    server.asset(assetDetail('asset-9', { mainFile: assetFile('file-main', 'processed', { asset: 'asset-9' }) }))
    server.slotFile('asset-9', 'extra', assetFile('file-1', 'processed', { asset: 'asset-9' }))

    await vi.advanceTimersByTimeAsync(5 * SECOND - 1)
    expect(server.slotReads('asset-9')).toBe(0)
    await vi.advanceTimersByTimeAsync(1)

    expect(server.slotReads('asset-9')).toBe(1)
    expect(row.status).toBe('uploaded')
    // The asset is asked for right after, for what it knows about the row.
    await vi.advanceTimersByTimeAsync(SECOND)
    expect([server.assetReads('asset-9'), row.assetStatus, row.canEditMetadata]).toEqual([1, 'with_file', false])
  })

  it('settles an import from an external provider, whose file is known from the answer to the import on', async () => {
    const store = await start()
    const [row] = await sent(store, GLOBAL, [
      queueRow({
        type: 'externalProviderAsset',
        status: 'waiting',
        assetId: null,
        fileId: null,
        externalProviderAssetId: 'photo-9',
        externalProviderName: 'unsplash',
      }),
    ])
    expect([row.assetId, row.fileId]).toEqual(['asset-1', 'file-1'])
    server.asset(assetDetail('asset-1'))

    await vi.advanceTimersByTimeAsync(5 * SECOND - 1)
    expect(server.assetReads('asset-1')).toBe(0)
    await vi.advanceTimersByTimeAsync(1)

    expect([row.status, row.canEditMetadata, row.keywords]).toEqual(['uploaded', true, ['keyword-server']])
  })

  // Mass edit asks once, for the metadata of what was picked; the poll has nothing to do with its rows.
  it('loads the assets picked for mass edit, and never asks about them again', async () => {
    const store = await start()
    const listed = (id: string) => ({
      id,
      attributes: { assetType: 'image', assetStatus: 'with_file' },
      texts: { displayTitle: id },
      mainFile: { id: 'file-of-' + id, links: {} },
      mainFileSingleUse: null,
    })
    server.asset(assetDetail('asset-a', { mainFile: assetFile('file-of-asset-a') }))
    server.asset(assetDetail('asset-b', { mainFile: assetFile('file-of-asset-b', 'stored') }))
    // An upload waits in the very same queue, so the queue is asked about all the time.
    const [upload] = await sent(store, EDIT, [waitingUpload()])

    await store.addByAssets(EDIT, [listed('asset-a'), listed('asset-b')] as never)
    await vi.advanceTimersByTimeAsync(0)

    const [, first, second] = store.getQueueItems(EDIT)
    expect([first.status, first.canEditMetadata, first.keywords]).toEqual(['uploaded', true, ['keyword-server']])
    expect([second.status, second.canEditMetadata]).toEqual(['uploaded', true])

    await vi.advanceTimersByTimeAsync(60 * MINUTE)

    expect(upload.status).toBe('processing')
    expect(server.assetReads('asset-1')).toBeGreaterThan(10)
    // Each of the two was read once, by the load of the selection.
    expect([server.assetReads('asset-a'), server.assetReads('asset-b')]).toEqual([1, 1])
    expect(second.status).toBe('uploaded')
  })
})

describe('the poll of a queue', () => {
  it('asks about every row that waits in one request, by the licence of the rows', async () => {
    const store = await start()
    const rows = await sent(store, GLOBAL, [waitingUpload(), waitingUpload()])
    server.asset(assetDetail('asset-1'))
    server.asset(assetDetail('asset-2', { mainFile: assetFile('file-2', 'processed', { asset: 'asset-2' }) }))

    await vi.advanceTimersByTimeAsync(5 * SECOND)

    expect(assetReadUrls()).toBe('/adm/v1/asset/licence/1/ids/asset-1,asset-2')
    expect(rows.map((row) => [row.status, row.canEditMetadata])).toEqual([
      ['uploaded', true],
      ['uploaded', true],
    ])
  })

  it('asks again and again while the file is not processed, less often as the row grows older', async () => {
    const store = await start()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])

    await vi.advanceTimersByTimeAsync(MINUTE)
    const inTheFirstMinute = server.assetReads('asset-1')
    await vi.advanceTimersByTimeAsync(MINUTE)
    const inTheSecondMinute = server.assetReads('asset-1') - inTheFirstMinute

    expect(inTheFirstMinute).toBeGreaterThan(inTheSecondMinute)
    expect(inTheSecondMinute).toBeGreaterThan(0)
    expect([row.status, row.error.hasError]).toEqual(['processing', false])

    // Nothing ends it but the file being done, however long that takes.
    await vi.advanceTimersByTimeAsync(3 * 60 * MINUTE)
    const before = server.assetReads('asset-1')
    server.asset(assetDetail('asset-1'))
    await vi.advanceTimersByTimeAsync(10 * MINUTE)

    expect(server.assetReads('asset-1')).toBe(before + 1)
    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', true])
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
  })

  it('fails a row with the text of an unknown error once the server did not know its asset three times', async () => {
    const store = await start()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.assetBy('asset-1', () => {
      throw httpError(404)
    })

    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(server.assetReads('asset-1')).toBe(3)
    expect(row.status).toBe('failed')
    expect(row.error).toEqual({
      hasError: true,
      message: 'system.uploadErrors.unknownError',
      assetFileFailReason: 'none',
    })
    expect(row.canEditMetadata).toBe(false)
    expect([store.getQueueProcessedCount(GLOBAL), store.getQueueTotalCount(GLOBAL)]).toEqual([1, 1])

    await vi.advanceTimersByTimeAsync(60 * MINUTE)

    expect(server.assetReads('asset-1')).toBe(3)
  })

  // A server that does not answer says nothing about the asset: the row waits, and says so once it has waited
  // through three reads in vain.
  it('warns on a row whose read failed three times, and takes the warning back with the read that answers', async () => {
    const store = await start()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    let down = true
    server.assetBy('asset-1', () => {
      if (down) throw httpError(500)

      return assetDetail('asset-1', { mainFile: assetFile('file-1', 'stored', { asset: 'asset-1' }) })
    })

    // The second read that failed, and not yet the third.
    await vi.advanceTimersByTimeAsync(30 * SECOND)
    expect(server.assetReads('asset-1')).toBe(2)
    expect([row.status, row.error.hasError]).toEqual(['processing', false])

    await vi.advanceTimersByTimeAsync(30 * SECOND)
    expect(server.assetReads('asset-1')).toBe(3)
    expect(row.status).toBe('processing')
    expect(row.error).toEqual({
      hasError: true,
      message: 'system.uploadErrors.metadataFailed',
      assetFileFailReason: 'none',
    })

    down = false
    await vi.advanceTimersByTimeAsync(5 * MINUTE)

    expect(row.status).toBe('processing')
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
  })

  it('takes an answer to the read of several rows that carries no list for a read that failed', async () => {
    const store = await start()
    const rows = await sent(store, GLOBAL, [waitingUpload(), waitingUpload()])
    let answersAList = false
    server.on('GET', /^\/adm\/v1\/asset\/licence\/1\/ids\//, () => {
      if (!answersAList) return { status: 200, data: { message: 'no list here' } }

      return {
        status: 200,
        data: {
          data: [
            assetDetail('asset-1'),
            assetDetail('asset-2', { mainFile: assetFile('file-2', 'processed', { asset: 'asset-2' }) }),
          ],
        },
      }
    })

    await vi.advanceTimersByTimeAsync(10 * MINUTE)

    // Not "none of these assets exist": nothing fails, the rows only say their data could not be loaded.
    expect(rows.map((row) => row.status)).toEqual(['processing', 'processing'])
    expect(rows.map((row) => row.error.message)).toEqual([
      'system.uploadErrors.metadataFailed',
      'system.uploadErrors.metadataFailed',
    ])

    answersAList = true
    await vi.advanceTimersByTimeAsync(10 * MINUTE)

    expect(rows.map((row) => [row.status, row.canEditMetadata, row.error.hasError])).toEqual([
      ['uploaded', true, false],
      ['uploaded', true, false],
    ])
  })

  it('says after twenty minutes that the processing takes too long, and goes on asking', async () => {
    const store = await start()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])

    await vi.advanceTimersByTimeAsync(19 * MINUTE)
    expect(row.error.hasError).toBe(false)
    await vi.advanceTimersByTimeAsync(2 * MINUTE)

    expect(row.status).toBe('processing')
    expect(row.error.message).toBe('system.uploadErrors.processingTooLong')
    const reads = server.assetReads('asset-1')

    await vi.advanceTimersByTimeAsync(30 * MINUTE)

    expect(server.assetReads('asset-1')).toBeGreaterThan(reads)
  })
})

describe('a row that leaves its queue while the server still works on its file', () => {
  const leave: Array<[string, (store: Store, row: UploadQueueItem) => unknown]> = [
    ['removed by its asset', (store) => store.removeByAssetId(GLOBAL, 'asset-1')],
    ['stopped on its own', (store, row) => store.stopItemUpload(GLOBAL, row)],
    ['stopped with the whole queue', (store) => store.stopUpload(GLOBAL)],
    ['cleared with the queue', (store) => store.clearQueue(GLOBAL)],
    ['dropped with every queue', (store) => store.reset()],
  ]

  it.each(leave)('takes the timer of its queue with it, and is asked about no more: %s', async (_name, act) => {
    const store = await start()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.asset(assetDetail('asset-1'))
    expect(queueTimers.waiting()).toBe(1)

    await act(store, row)

    expect(queueTimers.waiting()).toBe(0)
    await vi.advanceTimersByTimeAsync(60 * MINUTE)
    expect(server.assetReads('asset-1')).toBe(0)
  })

  it('is a stopped row once its queue is cleared, as when the queue is stopped', async () => {
    const store = await start()
    const [cleared] = await sent(store, GLOBAL, [waitingUpload()])
    const [stopped] = await sent(store, SLOTS, [
      waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }),
    ])

    store.clearQueue(GLOBAL)
    store.stopUpload(SLOTS)

    expect([cleared.status, stopped.status]).toEqual(['stop', 'stop'])
  })

  it('leaves the timer of its queue to the row that still waits there', async () => {
    const store = await start()
    const [first, second] = await sent(store, GLOBAL, [waitingUpload(), waitingUpload()])
    server.asset(assetDetail('asset-2', { mainFile: assetFile('file-2', 'processed', { asset: 'asset-2' }) }))

    await store.stopItemUpload(GLOBAL, first)

    expect(queueTimers.waiting()).toBe(1)
    await vi.advanceTimersByTimeAsync(5 * SECOND)
    expect(assetReadUrls()).toBe('/adm/v1/asset/asset-2')
    expect(second.status).toBe('uploaded')
    expect(queueTimers.waiting()).toBe(0)
  })

  // Its poll is idle by then, and goes only with the queue.
  it('leaves a queue that, emptied row by row and then stopped, gives up its listener for the tab', async () => {
    const store = await start()
    const tab = await watchedTab()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    await store.stopItemUpload(GLOBAL, row)
    expect(store.getQueueItems(GLOBAL)).toEqual([])
    expect([queueTimers.waiting(), tab.listeners()]).toEqual([0, 1])

    store.stopUpload(GLOBAL)

    expect(tab.listeners()).toBe(0)
  })

  // The read its notification asked for was still to come.
  it.each(leave)('takes the read a notification asked for on its behalf with it: %s', async (_name, act) => {
    const store = await start({ enabled: true, webSocketUrl: SOCKET_URL })
    sockets[0].opens()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.asset(assetDetail('asset-1'))
    sockets[0].says('asset_metadata_processed', { asset: 'asset-1' })
    // The timer of the queue, and the wait before the read of the notification.
    expect(queueTimers.waiting()).toBe(2)

    await act(store, row)

    expect(queueTimers.waiting()).toBe(0)
    await vi.advanceTimersByTimeAsync(60 * MINUTE)
    expect(server.assetReads('asset-1')).toBe(0)
  })
})

// Through pinia (`$dispose()`): the queues go with their store.
describe('an upload queue store that is disposed of', () => {
  it('leaves nothing behind: no timer, no listener for the tab, and nothing is asked any more', async () => {
    const store = await start({ enabled: true, webSocketUrl: SOCKET_URL })
    const tab = await watchedTab()
    sockets[0].opens()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.asset(assetDetail('asset-1'))
    expect([queueTimers.waiting(), tab.listeners()]).toEqual([1, 1])

    store.$dispose()

    expect([queueTimers.waiting(), tab.listeners()]).toEqual([0, 0])
    // Neither a notification nor the socket going away wakes it.
    sockets[0].says('asset_file_processed', { asset: 'asset-1', id: 'file-1' })
    sockets[0].drops()
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(queueTimers.waiting()).toBe(0)
    expect(server.assetReads('asset-1')).toBe(0)
    expect(row.status).toBe('processing')
  })
})

// The failed notification can beat the answer to the finish request, as the processed one can.
describe('an upload the server fails while its finish request is still on its way', () => {
  it('is not asked about when that request fails as well: the server has said its last word', async () => {
    const store = await start({ enabled: true, webSocketUrl: SOCKET_URL })
    sockets[0].opens()
    const [row] = seedQueue(store, GLOBAL, [waitingUpload()])
    let answerFinish: () => void = () => undefined
    server.on('PATCH', /\/image\/file-1\/uploaded$/, async () => {
      await new Promise<void>((resolve) => (answerFinish = resolve))
      throw httpError(500)
    })
    store.processUpload(GLOBAL)
    await vi.advanceTimersByTimeAsync(0)
    expect(row.status).toBe('uploading')
    const failed = assetFile('file-1', 'failed', { asset: 'asset-1' })
    failed.fileAttributes.failReason = 'invalid_mime_type'
    server.asset(assetDetail('asset-1', { mainFile: failed }))

    sockets[0].says('asset_file_failed', { asset: 'asset-1', id: 'file-1', failReason: 'invalid_mime_type' })
    expect([row.status, row.error.assetFileFailReason]).toEqual(['failed', 'invalid_mime_type'])
    answerFinish()
    await vi.advanceTimersByTimeAsync(0)

    expect(queueTimers.waiting()).toBe(0)
    await vi.advanceTimersByTimeAsync(MINUTE)
    expect(server.assetReads('asset-1')).toBe(0)
    expect([row.status, row.error.assetFileFailReason]).toEqual(['failed', 'invalid_mime_type'])
    expect([store.getQueueProcessedCount(GLOBAL), store.getQueueTotalCount(GLOBAL)]).toEqual([1, 1])
  })
})

/* The poll asks for as long as a row waits, through an outage too: the first read that fails is written down
 * (the api error logger: the console, or Sentry where an application sets it), the ones after it are not, until
 * a read has answered. The refresh button is the user asking, and is written down every time. */
describe('what is written down of the reads that fail', () => {
  it('writes down the first failed read about a row, none that follow it, and one again after a read that answered', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    let down = true
    server.assetBy('asset-1', () => {
      if (down) throw httpError(500)

      return assetDetail('asset-1', { mainFile: assetFile('file-1', 'stored', { asset: 'asset-1' }) })
    })

    await vi.advanceTimersByTimeAsync(2 * MINUTE)
    expect(server.assetReads('asset-1')).toBe(4)
    expect(logged).toEqual([{ url: '/adm/v1/asset/asset-1', status: 500 }])

    down = false
    await vi.advanceTimersByTimeAsync(4 * MINUTE)
    const answered = server.assetReads('asset-1') - 4
    expect(answered).toBeGreaterThan(0)
    expect(logged).toHaveLength(1)

    down = true
    await vi.advanceTimersByTimeAsync(10 * MINUTE)
    expect(server.assetReads('asset-1')).toBeGreaterThan(4 + answered + 1)
    expect(logged).toEqual([
      { url: '/adm/v1/asset/asset-1', status: 500 },
      { url: '/adm/v1/asset/asset-1', status: 500 },
    ])
    expect(row.status).toBe('processing')
  })

  it('writes down the read of several rows once, the request they share', async () => {
    const store = await start()
    const logged = await loggedFailures()
    await sent(store, GLOBAL, [waitingUpload(), waitingUpload()])
    server.on('GET', /^\/adm\/v1\/asset\/licence\/1\/ids\//, () => {
      throw httpError(503)
    })

    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(server.sent('GET', /^\/adm\/v1\/asset\/licence\/1\/ids\//)).toHaveLength(3)
    expect(logged).toEqual([{ url: '/adm/v1/asset/licence/1/ids/asset-1,asset-2', status: 503 }])
  })

  it('writes down the read of the slots of an asset once', async () => {
    const store = await start()
    const logged = await loggedFailures()
    await sent(store, SLOTS, [waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' })])
    server.slotsBy('asset-9', () => {
      throw httpError(500)
    })

    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(server.slotReads('asset-9')).toBe(3)
    expect(logged).toEqual([{ url: '/adm/v1/asset-slot/asset/asset-9', status: 500 }])
  })

  it('writes down an asset the server does not know once, across the three reads that fail its row', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.assetBy('asset-1', () => {
      throw httpError(404)
    })

    await vi.advanceTimersByTimeAsync(MINUTE)

    expect([server.assetReads('asset-1'), row.status]).toEqual([3, 'failed'])
    expect(logged).toEqual([{ url: '/adm/v1/asset/asset-1', status: 404 }])
  })

  // Deleted while its file was being processed: the list of its slots answers 404 at each of the three reads.
  it('writes down the deleted asset of a slot upload once, across the three reads that fail its row', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const [row] = await sent(store, SLOTS, [waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' })])
    server.assetDeleted('asset-9')

    await vi.advanceTimersByTimeAsync(MINUTE)

    expect([server.slotReads('asset-9'), row.status, row.error.message]).toEqual([
      3,
      'failed',
      'system.uploadErrors.unknownError',
    ])
    expect(logged).toEqual([{ url: '/adm/v1/asset-slot/asset/asset-9', status: 404 }])
  })

  it('writes it down again when the slots were read in between and the asset is gone once more', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const [row] = await sent(store, SLOTS, [waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' })])
    let reads = 0
    server.slotsBy('asset-9', () => {
      reads++
      // Gone twice, there once with the file still stored, then gone for good.
      if (reads !== 3) throw httpError(404)

      return { data: [{ slotName: 'extra', assetFile: assetFile(String(row.fileId), 'stored', { asset: 'asset-9' }) }] }
    })

    await vi.advanceTimersByTimeAsync(MINUTE)

    expect([reads, row.status]).toEqual([6, 'failed'])
    expect(logged).toEqual([
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 404 },
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 404 },
    ])
  })

  // What was written down for one upload says nothing of the next one into that slot.
  it('writes down what fails for the next upload into the slot of an asset that was gone for the one before', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const [first] = await sent(store, SLOTS, [
      waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }),
    ])
    // A gateway answers 404 for the slots of the asset, three times: the row fails.
    server.slotsBy('asset-9', () => {
      throw httpError(404)
    })
    await vi.advanceTimersByTimeAsync(MINUTE)
    expect([server.slotReads('asset-9'), first.status]).toEqual([3, 'failed'])
    expect(logged).toEqual([{ url: '/adm/v1/asset-slot/asset/asset-9', status: 404 }])

    // The user sends a file into that slot again, and now the server is in trouble.
    server.slotsBy('asset-9', () => {
      throw httpError(502)
    })
    store.addQueueItem(SLOTS, waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }))
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(0)
    const second = store.getQueueItems(SLOTS)[1]
    expect(second.status).toBe('processing')
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(server.slotReads('asset-9')).toBe(6)
    expect(second.status).toBe('processing')
    expect(logged).toEqual([
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 404 },
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 502 },
    ])
  })

  // Its first read came while the reads of another row kept failing, when nothing more was being written down.
  it('writes down the gone asset of a slot upload at the first read that is let, not before and once', async () => {
    const store = await start()
    const logged = await loggedFailures()
    await sent(store, SLOTS, [waitingUpload({ type: 'slotFile', assetId: 'asset-8', slotName: 'extra' })])
    server.slotsBy('asset-8', () => {
      throw httpError(500)
    })
    await vi.advanceTimersByTimeAsync(6 * SECOND)
    expect(logged).toEqual([{ url: '/adm/v1/asset-slot/asset/asset-8', status: 500 }])

    store.addQueueItem(SLOTS, waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }))
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(0)
    const second = store.getQueueItems(SLOTS)[1]
    expect(second.status).toBe('processing')
    server.assetDeleted('asset-9')
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect([server.slotReads('asset-9'), second.status]).toEqual([3, 'failed'])
    expect(logged).toEqual([
      { url: '/adm/v1/asset-slot/asset/asset-8', status: 500 },
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 404 },
    ])
  })

  /** A second file into another slot of `asset-9`, whose only chunk the server holds: it is still being sent. */
  const secondSlotUploadHeld = async (store: Store) => {
    let answerChunk: () => void = () => undefined
    server.on('POST', /\/image\/file-2\/chunk$/, async () => {
      await new Promise<void>((resolve) => (answerChunk = resolve))

      return { status: 201, data: {} }
    })
    store.addQueueItem(SLOTS, waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'bonus' }))
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(0)
    const row = store.getQueueItems(SLOTS)[1]
    expect([row.status, row.fileId]).toEqual(['uploading', 'file-2'])

    return { row, answerChunk: () => answerChunk() }
  }

  // What was written down while a file was still being sent was not written down for that file.
  it('writes down what fails for a slot upload that was still being sent when the asset was gone for another', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const [first] = await sent(store, SLOTS, [
      waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }),
    ])
    const second = await secondSlotUploadHeld(store)
    server.slotsBy('asset-9', () => {
      throw httpError(404)
    })
    await vi.advanceTimersByTimeAsync(MINUTE)
    expect([server.slotReads('asset-9'), first.status, second.row.status]).toEqual([3, 'failed', 'uploading'])
    expect(logged).toEqual([{ url: '/adm/v1/asset-slot/asset/asset-9', status: 404 }])

    // The second file is with the server now, which is in trouble.
    server.slotsBy('asset-9', () => {
      throw httpError(502)
    })
    second.answerChunk()
    await vi.advanceTimersByTimeAsync(0)
    expect(second.row.status).toBe('processing')
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(server.slotReads('asset-9')).toBe(6)
    expect(logged).toEqual([
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 404 },
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 502 },
    ])
  })

  // A row that is not asked about yet does not make the same answer new.
  it('writes down the gone asset of a slot upload once although another file goes into a slot of it meanwhile', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const [first] = await sent(store, SLOTS, [
      waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }),
    ])
    server.slotsBy('asset-9', () => {
      throw httpError(404)
    })
    await vi.advanceTimersByTimeAsync(6 * SECOND)
    expect([server.slotReads('asset-9'), logged.length]).toEqual([1, 1])

    const second = await secondSlotUploadHeld(store)
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect([server.slotReads('asset-9'), first.status, second.row.status]).toEqual([3, 'failed', 'uploading'])
    expect(logged).toEqual([{ url: '/adm/v1/asset-slot/asset/asset-9', status: 404 }])
  })

  it('writes down the first try of the read a notification asked for, not the tries after it', async () => {
    const store = await start({ enabled: true, webSocketUrl: SOCKET_URL })
    sockets[0].opens()
    const logged = await loggedFailures()
    const [row] = seedQueue(store, GLOBAL, [queueRow({ status: 'uploading' })])
    server.assetBy('asset-1', () => {
      throw httpError(500)
    })

    sockets[0].says('asset_metadata_processed', { asset: 'asset-1' })
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(server.assetReads('asset-1')).toBe(3)
    expect(row.error.message).toBe('system.uploadErrors.metadataFailed')
    expect(logged).toEqual([{ url: '/adm/v1/asset/asset-1', status: 500 }])
  })

  it('writes down every read the refresh button asked for that failed, whatever the poll has written down', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.assetBy('asset-1', () => {
      throw httpError(500)
    })

    await vi.advanceTimersByTimeAsync(30 * SECOND)
    expect([server.assetReads('asset-1'), logged.length]).toEqual([2, 1])

    expect(await store.refreshQueueItem(row)).toBe('error')
    expect(await store.refreshQueueItem(row)).toBe('error')

    expect([server.assetReads('asset-1'), logged.length]).toEqual([4, 3])
    await vi.advanceTimersByTimeAsync(MINUTE)
    // The poll goes on asking, and has said what it had to say.
    expect(server.assetReads('asset-1')).toBeGreaterThan(4)
    expect(logged).toHaveLength(3)
  })

  it('writes nothing down of an upload whose reads all answer', async () => {
    const store = await start()
    const logged = await loggedFailures()
    const rows = await sent(store, GLOBAL, [waitingUpload(), waitingUpload()])
    const [slot] = await sent(store, SLOTS, [
      waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }),
    ])
    server.asset(assetDetail('asset-9', { mainFile: assetFile('file-main', 'processed', { asset: 'asset-9' }) }))

    // Not finished yet, then finished: every read answers.
    await vi.advanceTimersByTimeAsync(30 * SECOND)
    server.asset(assetDetail('asset-1'))
    server.asset(assetDetail('asset-2', { mainFile: assetFile('file-2', 'processed', { asset: 'asset-2' }) }))
    server.slotFile('asset-9', 'extra', assetFile(String(slot.fileId), 'processed', { asset: 'asset-9' }))
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect([...rows, slot].map((row) => row.status)).toEqual(['uploaded', 'uploaded', 'uploaded'])
    expect(logged).toEqual([])
  })
})

describe('an upload whose finish request fails', () => {
  // The whole file is with the server by then, which may well complete it.
  it('fails on its row, and is uploaded with its metadata and its form once the server has finished the file', async () => {
    const store = await start()
    const [row] = seedQueue(store, GLOBAL, [waitingUpload()])
    server.on('PATCH', /\/image\/file-1\/uploaded$/, () => {
      throw httpError(500)
    })
    store.processUpload(GLOBAL)
    await vi.advanceTimersByTimeAsync(0)
    expect([row.status, row.error.message]).toEqual(['failed', 'system.uploadErrors.unknownError'])

    // Asked about for as long as it stays, and never told that its processing takes too long: it is not processing.
    await vi.advanceTimersByTimeAsync(30 * MINUTE)
    expect(server.assetReads('asset-1')).toBeGreaterThan(5)
    expect([row.status, row.error.message]).toEqual(['failed', 'system.uploadErrors.unknownError'])

    server.asset(assetDetail('asset-1'))
    await vi.advanceTimersByTimeAsync(10 * MINUTE)

    expect([row.status, row.canEditMetadata, row.keywords]).toEqual(['uploaded', true, ['keyword-server']])
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })
    expect([store.getQueueProcessedCount(GLOBAL), store.getQueueTotalCount(GLOBAL)]).toEqual([1, 1])
  })

  it('fails for good when the server says the file failed', async () => {
    const store = await start()
    const [row] = seedQueue(store, GLOBAL, [waitingUpload()])
    server.on('PATCH', /\/image\/file-1\/uploaded$/, () => {
      throw httpError(500)
    })
    store.processUpload(GLOBAL)
    await vi.advanceTimersByTimeAsync(0)
    const failed = assetFile('file-1', 'failed', { asset: 'asset-1' })
    failed.fileAttributes.failReason = 'invalid_checksum'
    server.asset(assetDetail('asset-1', { mainFile: failed }))

    await vi.advanceTimersByTimeAsync(MINUTE)
    const reads = server.assetReads('asset-1')

    // The reason of the server in place of the text of the client.
    expect(row.status).toBe('failed')
    expect(row.error).toEqual({ hasError: true, message: '', assetFileFailReason: 'invalid_checksum' })

    await vi.advanceTimersByTimeAsync(30 * MINUTE)

    expect(server.assetReads('asset-1')).toBe(reads)
  })
})

// The server could not be asked about the asset while the file was still being sent, and the row said so. Then
// the upload itself failed: from there on that failure is what the row says, whatever is read about it later.
describe('an upload that fails after its row was warned that its data could not be loaded', () => {
  it('keeps the text of its failure at the reads that follow', async () => {
    const store = await start({ enabled: true, webSocketUrl: SOCKET_URL })
    sockets[0].opens()
    const [row] = seedQueue(store, GLOBAL, [waitingUpload()])
    let answerFinish: () => void = () => undefined
    server.on('PATCH', /\/image\/file-1\/uploaded$/, async () => {
      await new Promise<void>((resolve) => (answerFinish = resolve))
      throw httpError(500)
    })
    server.assetBy('asset-1', () => {
      throw httpError(500)
    })
    store.processUpload(GLOBAL)
    await vi.advanceTimersByTimeAsync(0)
    expect(row.status).toBe('uploading')

    // The read its metadata notification asks for fails three times.
    sockets[0].says('asset_metadata_processed', { asset: 'asset-1' })
    await vi.advanceTimersByTimeAsync(MINUTE)
    expect(server.assetReads('asset-1')).toBe(3)
    expect([row.status, row.error.message]).toEqual(['uploading', 'system.uploadErrors.metadataFailed'])

    answerFinish()
    await vi.advanceTimersByTimeAsync(0)
    const failure = { hasError: true, message: 'system.uploadErrors.unknownError', assetFileFailReason: 'none' }
    expect([row.status, row.error]).toEqual(['failed', failure])

    // The row is asked about on, its finish request having gone out; the reads still fail.
    await vi.advanceTimersByTimeAsync(10 * MINUTE)
    expect(server.assetReads('asset-1')).toBeGreaterThan(5)
    expect([row.status, row.error]).toEqual(['failed', failure])

    // And a read that answers, the file not finished, leaves the failure where it is as well.
    server.asset(assetDetail('asset-1', { mainFile: assetFile('file-1', 'stored', { asset: 'asset-1' }) }))
    await vi.advanceTimersByTimeAsync(10 * MINUTE)
    expect([row.status, row.error]).toEqual(['failed', failure])
  })
})

// Not every finish request that fails leaves the question open: the server may have answered it, with a no.
describe('an upload whose finish request the server answers with a refusal', () => {
  const finishRefused = async (queueId: string, row: UploadQueueItem, refusal: () => unknown) => {
    const store = await start()
    const [seeded] = seedQueue(store, queueId, [row])
    server.on('PATCH', /\/image\/file-1\/uploaded$/, () => {
      throw refusal()
    })
    store.processUpload(queueId)
    await vi.advanceTimersByTimeAsync(0)

    return { store, row: seeded }
  }

  it.each([400, 403, 404, 409, 422, 499])('fails for good and is not asked about: %s', async (status) => {
    const { store, row } = await finishRefused(GLOBAL, waitingUpload(), () => httpError(status))

    expect([row.status, row.error.message, row.canEditMetadata]).toEqual([
      'failed',
      'system.uploadErrors.unknownError',
      false,
    ])
    expect(queueTimers.waiting()).toBe(0)
    // Whatever the server says of the asset afterwards.
    server.asset(assetDetail('asset-1'))
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(server.assetReads('asset-1')).toBe(0)
    expect(row.status).toBe('failed')
    expect([store.getQueueProcessedCount(GLOBAL), store.getQueueTotalCount(GLOBAL)]).toEqual([1, 1])
  })

  it('says on its row what the server found wrong with the file', async () => {
    const { row } = await finishRefused(GLOBAL, waitingUpload(), () =>
      validationError({ size: ['error_field_invalid'] })
    )

    expect([row.status, row.error.message]).toEqual(['failed', 'system.uploadErrors.size'])
    expect(queueTimers.waiting()).toBe(0)
  })

  it('is so for a file sent into a slot as well', async () => {
    const { row } = await finishRefused(
      SLOTS,
      waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' }),
      () => httpError(422)
    )

    expect(row.status).toBe('failed')
    expect(queueTimers.waiting()).toBe(0)
    server.slotFile('asset-9', 'extra', assetFile('file-1', 'processed', { asset: 'asset-9' }))
    await vi.advanceTimersByTimeAsync(MINUTE)

    expect(server.slotReads('asset-9')).toBe(0)
    expect(row.status).toBe('failed')
  })
})

// The request may have reached the server and been carried out, for all the client knows.
describe('an upload whose finish request gets no answer, or the answer of a server in trouble', () => {
  const unanswered: Array<[string, () => unknown]> = [
    ['the network fails', () => new AxiosError('Network Error', AxiosError.ERR_NETWORK)],
    ['the request times out', () => new AxiosError('timeout of 30000ms exceeded', AxiosError.ECONNABORTED)],
    ['the server answers 500', () => httpError(500)],
    ['a gateway answers 502', () => httpError(502)],
    ['a gateway answers 504', () => httpError(504)],
  ]

  it.each(unanswered)(
    'is asked about, and comes back when the server has the file done: %s',
    async (_name, failure) => {
      const store = await start()
      const [row] = seedQueue(store, GLOBAL, [waitingUpload()])
      server.on('PATCH', /\/image\/file-1\/uploaded$/, () => {
        throw failure()
      })
      store.processUpload(GLOBAL)
      await vi.advanceTimersByTimeAsync(0)
      expect([row.status, row.error.message]).toEqual(['failed', 'system.uploadErrors.unknownError'])
      expect(queueTimers.waiting()).toBe(1)

      server.asset(assetDetail('asset-1'))
      await vi.advanceTimersByTimeAsync(MINUTE)

      expect(server.assetReads('asset-1')).toBe(1)
      expect([row.status, row.canEditMetadata]).toEqual(['uploaded', true])
    }
  )
})

describe('an upload one of whose chunks fails', () => {
  // The server never had the whole file: there is nothing it could finish.
  it('fails on its row and is not asked about', async () => {
    const store = await start()
    const [row] = seedQueue(store, GLOBAL, [waitingUpload()])
    server.on('POST', /\/image\/file-1\/chunk$/, () => {
      throw httpError(422, { error: 'validation_failed', contextId: 'context', fields: { size: ['invalid'] } })
    })
    store.processUpload(GLOBAL)
    await vi.advanceTimersByTimeAsync(0)
    expect(row.status).toBe('failed')
    server.asset(assetDetail('asset-1'))

    await vi.advanceTimersByTimeAsync(60 * MINUTE)

    expect(server.assetReads('asset-1')).toBe(0)
    expect(row.status).toBe('failed')
  })
})

describe.each([true, 'true'] as const)('an application whose notification service is on (%j)', (enabled) => {
  const withService = async () => {
    const store = await start({ enabled, webSocketUrl: SOCKET_URL })
    expect(sockets.map((socket) => socket.url)).toEqual([SOCKET_URL])

    return { store, socket: sockets[0] }
  }

  it('asks about a sent file ten seconds after it was sent while the socket is open', async () => {
    const { store, socket } = await withService()
    socket.opens()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.asset(assetDetail('asset-1'))

    await vi.advanceTimersByTimeAsync(10 * SECOND - 1)
    expect(server.assetReads('asset-1')).toBe(0)
    expect(row.status).toBe('processing')
    await vi.advanceTimersByTimeAsync(1)

    // No notification came, and the row is settled all the same.
    expect(server.assetReads('asset-1')).toBe(1)
    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', true])
  })

  it('asks after five seconds while the socket has not opened: a connection that is not there brings nothing', async () => {
    const { store } = await withService()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.asset(assetDetail('asset-1'))

    await vi.advanceTimersByTimeAsync(5 * SECOND - 1)
    expect(server.assetReads('asset-1')).toBe(0)
    await vi.advanceTimersByTimeAsync(1)

    expect(server.assetReads('asset-1')).toBe(1)
    expect(row.status).toBe('uploaded')
  })

  it('asks sooner once the socket is lost', async () => {
    const { store, socket } = await withService()
    socket.opens()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.asset(assetDetail('asset-1'))
    await vi.advanceTimersByTimeAsync(SECOND)

    socket.drops()
    await vi.advanceTimersByTimeAsync(4 * SECOND - 1)
    expect(server.assetReads('asset-1')).toBe(0)
    await vi.advanceTimersByTimeAsync(1)

    expect(server.assetReads('asset-1')).toBe(1)
    expect(row.status).toBe('uploaded')
  })

  it('settles the row by its notifications, and the poll then has nothing to ask', async () => {
    const { store, socket } = await withService()
    socket.opens()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.asset(assetDetail('asset-1'))

    socket.says('asset_metadata_processed', { asset: 'asset-1' })
    socket.says('asset_file_processed', { asset: 'asset-1', id: 'file-1' })
    // The state at once, from the notification itself.
    expect(row.status).toBe('uploaded')
    await vi.advanceTimersByTimeAsync(SECOND)

    expect(server.assetReads('asset-1')).toBe(1)
    expect([row.status, row.canEditMetadata, row.keywords]).toEqual(['uploaded', true, ['keyword-server']])

    await vi.advanceTimersByTimeAsync(60 * MINUTE)

    expect(server.assetReads('asset-1')).toBe(1)
  })
})

// The read a metadata notification asked for can still be on its way when the file notification settles the row:
// the answer is older than what the row says of its file, and is still the one that carries its metadata.
describe('a metadata read that is answered after the processed notification has settled its row', () => {
  it('gives the row its metadata and its form all the same', async () => {
    const store = await start({ enabled: true, webSocketUrl: SOCKET_URL })
    sockets[0].opens()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    let answer: (asset: unknown) => void = () => undefined
    let reads = 0
    server.assetBy('asset-1', () => {
      reads++

      // The first read, the one the metadata notification asked for, is held open.
      return reads === 1 ? new Promise((resolve) => (answer = resolve)) : assetDetail('asset-1')
    })

    sockets[0].says('asset_metadata_processed', { asset: 'asset-1' })
    await vi.advanceTimersByTimeAsync(2 * SECOND)
    expect(server.assetReads('asset-1')).toBe(1)
    sockets[0].says('asset_file_processed', { asset: 'asset-1', id: 'file-1' })
    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', false])

    answer(assetDetail('asset-1'))
    await vi.advanceTimersByTimeAsync(SECOND)

    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', true])
    expect([row.keywords, row.customData]).toEqual([['keyword-server'], { title: 'from the server' }])
    expect(row.error).toEqual({ hasError: false, message: '', assetFileFailReason: 'none' })

    await vi.advanceTimersByTimeAsync(60 * MINUTE)

    // The two reads of the two notifications, and none after.
    expect(server.assetReads('asset-1')).toBe(2)
  })
})
