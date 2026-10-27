import type { UploadQueueItem } from '@anzusystems/common-admin'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { assetDetail, createFakeDam, queueRow, seedDamConfig, seedQueue, stubFileReader } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/*
 * Runs `main.ts` itself with a `config.json` answered by a faked `fetch`.
 * Stand-ins: the root component, the router, Vuetify, the server
 * and the global `WebSocket`. Nothing of the library is replaced.
 * Without the notification service the upload queue asks the server
 * itself. That side is tested in `fallback/uploadStatusPolling.test.ts`.
 */

let server: FakeDam
const appSetUp = vi.fn()

vi.mock('@/shared/apiClients/damClient', () => ({ damClient: () => server.client }))
vi.mock('@/App.vue', () => ({
  default: {
    setup: () => {
      appSetUp()

      return () => null
    },
  },
}))
vi.mock('@/router', () => ({ router: { install: () => undefined } }))
vi.mock('@/plugins/vuetify', () => ({ vuetify: { install: () => undefined } }))
// The stylesheet is not code, and Sentry starts only with a dsn.
vi.mock('@anzusystems/common-admin/styles', () => ({}))
vi.mock('@sentry/vue', () => ({}))
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
    this.onclose?.({ code: 1000 })
  }

  opens() {
    this.readyState = 1
    this.onopen?.()
  }
}

const GLOBAL = 'global'
const SECOND = 1000
const SOCKET_URL = 'wss://notifications.test/ws'

const deployed = (over: Record<string, unknown> = {}) => ({
  adminSwitcherConfigUrl: '',
  appEnvironment: 'test',
  appVersion: '1',
  appLabel: '',
  logoutCoreDamUrl: '',
  cookies: { refreshTokenExistsName: 'rte', jwtPayloadName: 'jp' },
  dam: { apiUrl: 'https://dam.test', apiTimeout: 30, adminUrl: 'https://admin.test', authorCleanPhraseTestSample: '' },
  sentry: { dsn: '' },
  ...over,
})

const start = async (config: Record<string, unknown>) => {
  vi.resetModules()
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => config,
    }))
  )
  await import('@/main')
  // `main.ts` returns nothing to wait on. The root component being set up means the start has run.
  await vi.waitFor(() => expect(appSetUp).toHaveBeenCalledTimes(1))
  expect(document.getElementById('app')?.textContent).not.toContain('Fatal error')

  vi.useFakeTimers()
  const { useDamConfigStore } = await import('@anzusystems/common-admin')
  seedDamConfig(useDamConfigStore())
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()
  const { useUploadQueuesStore } = await import('@/domains/coreDam/asset/store/uploadQueuesStore')

  return useUploadQueuesStore()
}

const sentFile = async (store: Awaited<ReturnType<typeof start>>) => {
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
  server.asset(assetDetail('asset-1'))

  return row
}

const firstReadAt = async (row: UploadQueueItem) => {
  for (let second = 1; second <= 60; second++) {
    await vi.advanceTimersByTimeAsync(SECOND)
    if (server.assetReads('asset-1') > 0) {
      expect([row.status, row.canEditMetadata]).toEqual(['uploaded', true])

      return second
    }
  }

  return null
}

beforeEach(() => {
  vi.clearAllMocks()
  stubFileReader()
  sockets.length = 0
  vi.stubGlobal('WebSocket', FakeSocket)
  server = createFakeDam()
  // `main.ts` mounts into `#app`. The font mark keeps the library from fetching its fonts from the network.
  document.body.innerHTML = '<div id="app"></div>'
  document.head.innerHTML = '<link data-anzu-common-fonts>'
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

const withoutService: Array<[string, Record<string, unknown>]> = [
  ['has no block for the notification service', {}],
  ['has an empty block for it', { notification: {} }],
  ['has the service off', { notification: { enabled: false, webSocketUrl: SOCKET_URL } }],
  // A deployment template puts the value in quotes: a text, and not the text that switches the service on.
  ['has the service off as a text', { notification: { enabled: 'false', webSocketUrl: SOCKET_URL } }],
  ['has the service off as a text with a capital', { notification: { enabled: 'False', webSocketUrl: SOCKET_URL } }],
  ['says "1" for the service', { notification: { enabled: '1', webSocketUrl: SOCKET_URL } }],
  ['says "yes" for the service', { notification: { enabled: 'yes', webSocketUrl: SOCKET_URL } }],
  ['has an address for the service and does not say it is on', { notification: { webSocketUrl: SOCKET_URL } }],
  ['has the service on and no address for it', { notification: { enabled: true } }],
  ['has the service on and an empty address for it', { notification: { enabled: true, webSocketUrl: '' } }],
]

describe.each(withoutService)('an application whose config.json %s', (_name, block) => {
  it('starts, opens no socket, and settles an upload by asking the server five seconds after it was sent', async () => {
    const store = await start(deployed(block))

    const row = await sentFile(store)

    expect(await firstReadAt(row)).toBe(5)
    expect(sockets).toEqual([])
  })
})

// As a text, the word counts in any case and with surrounding spaces, as an environment variable may bring it.
describe.each([true, 'true', 'True', ' TRUE '])(
  'an application whose config.json has the service on (%j) with its address',
  (enabled) => {
    it('starts and opens one socket to that address; while it is open, the server is asked after ten seconds', async () => {
      const store = await start(deployed({ notification: { enabled, webSocketUrl: SOCKET_URL } }))
      expect(sockets.map((socket) => socket.url)).toEqual([SOCKET_URL])
      sockets[0].opens()

      const row = await sentFile(store)

      expect(await firstReadAt(row)).toBe(10)
      expect(sockets).toHaveLength(1)
    })
  }
)

describe('an application whose config.json still carries the switch of the old fallback', () => {
  it.each([true, false])('starts and asks the server all the same: uploadStatusFallback %s', async (value) => {
    const store = await start(deployed({ uploadStatusFallback: value }))

    const row = await sentFile(store)

    expect(await firstReadAt(row)).toBe(5)
  })
})
