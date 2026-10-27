import type { UploadQueueItem } from '@anzusystems/common-admin'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

import { createFakeDam, httpError, queueRow, seedDamConfig, seedQueue, stubFileReader } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

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
    this.readyState = 3
    this.onclose?.({ code: 1006 })
  }

  opens() {
    this.readyState = 1
    this.onopen?.()
  }

  says(eventName: string, data: Record<string, unknown>) {
    this.onmessage?.({ data: JSON.stringify({ eventName, data: JSON.stringify(data) }) })
  }
}

const GLOBAL = 'global'
const SLOTS = 'slots'
const MINUTE = 60_000
const SOCKET_URL = 'wss://notifications.test/ws'

const start = async (notifications = false) => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { AnzuSystemsCommonAdmin, useDamConfigStore } = await import('@anzusystems/common-admin')
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
      ...(notifications ? { notification: { enabled: true, webSocketUrl: SOCKET_URL } } : {}),
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

const sent = async (store: Store, queueId: string, rows: UploadQueueItem[]) => {
  const seeded = seedQueue(store, queueId, rows)
  store.processUpload(queueId)
  await vi.advanceTimersByTimeAsync(0)
  seeded.forEach((row) => expect(row.status).toBe('processing'))

  return seeded
}

const loggedFailures = async () => {
  const { setApiErrorLogger } = await import('@anzusystems/common-admin')
  const logged: Array<{ url: string | undefined; status: number | undefined }> = []
  setApiErrorLogger((_error, context) => {
    logged.push({ url: context.url, status: context.status })
  })

  return logged
}

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

describe('an uploaded row without its form, whose asset is gone', () => {
  it('fails after three reads that miss its asset, and says the asset no longer exists', async () => {
    const store = await start(true)
    sockets[0].opens()
    const [row] = await sent(store, GLOBAL, [waitingUpload()])
    server.assetDeleted('asset-1')

    sockets[0].says('asset_file_processed', { asset: 'asset-1', id: 'file-1' })
    expect([row.status, row.canEditMetadata]).toEqual(['uploaded', false])
    await vi.advanceTimersByTimeAsync(10 * MINUTE)

    expect(server.assetReads('asset-1')).toBe(3)
    expect([row.status, row.error.hasError, row.error.message]).toEqual([
      'failed',
      true,
      'common.damImage.queueItem.assetGone',
    ])
  })
})

/*
 * A quiet read of the slots of an asset must not start a failure streak.
 * Previously a failed quiet read was counted as a written-down failure, so nothing was written down while reads failed,
 * also for a later upload into the same asset.
 */
describe('the reads of the slots of an asset that fail after its 404 was written down', () => {
  it('begin no streak: a failure of a read for an upload not written down for is written down', async () => {
    const store = await start()
    const logged = await loggedFailures()
    await sent(store, SLOTS, [waitingUpload({ type: 'slotFile', assetId: 'asset-9', slotName: 'extra' })])
    let reads = 0
    server.slotsBy('asset-9', () => {
      reads++
      throw httpError(reads === 1 ? 404 : 502)
    })
    await vi.advanceTimersByTimeAsync(MINUTE)
    expect(reads).toBeGreaterThan(1)
    expect(logged).toEqual([{ url: '/adm/v1/asset-slot/asset/asset-9', status: 404 }])

    await store.addByFilesAsSlotUpload(
      SLOTS,
      [new File(['abc'], 'other.jpg', { type: 'image/jpeg' })],
      'asset-9',
      'bonus',
      'image'
    )
    store.processUpload(SLOTS)
    await vi.advanceTimersByTimeAsync(2 * MINUTE)

    expect(store.getQueueItems(SLOTS)[1].status).toBe('processing')
    expect(logged).toEqual([
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 404 },
      { url: '/adm/v1/asset-slot/asset/asset-9', status: 502 },
    ])
  })
})
