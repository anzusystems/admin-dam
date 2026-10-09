import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFakeDam } from '@/test/support/fakeDam'
import type { FakeDam } from '@/test/support/fakeDam'

/* The notifications that are not about an upload: today they are the only thing that moves a distribution along,
 * confirms a sign-in to a distribution service or re-reads the user. The real listener over the real stores, a
 * fake server and a fake connection. The upload ones are in `queue/notificationSettlesQueue.test.ts`. */

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
vi.mock('@/domains/coreDam/author/composables/cachedAuthors', () => ({
  useCachedAuthors: () => ({ addToCachedAuthors: vi.fn(), fetchCachedAuthors: vi.fn() }),
}))
vi.mock('@/domains/coreDam/keyword/composables/cachedKeywords', () => ({
  useCachedKeywords: () => ({ addToCachedKeywords: vi.fn(), fetchCachedKeywords: vi.fn() }),
}))

const load = async () => {
  vi.resetModules()
  setActivePinia(createPinia())
  const { initAppNotificationListeners } = await import('@/domains/system/composables/appNotificationListeners')
  initAppNotificationListeners()
  const { useDistributionListStore } = await import('@/domains/coreDam/asset/store/distributionListStore')

  return useDistributionListStore()
}

const notify = (name: string, data: Record<string, unknown>) =>
  listeners.forEach((listener) => listener({ name, data }))

const distribution = (id: string, status: string, over: Record<string, unknown> = {}) => ({
  id,
  status,
  distributionService: 'youtube_main',
  extId: '',
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
  listeners.length = 0
  server = createFakeDam()
})

describe('a notification about a distribution', () => {
  const underWay: Array<[string, string]> = [
    ['distribution_distributing', 'distributing'],
    ['distribution_remote_processing', 'remote_processing'],
  ]

  it.each(underWay)('moves the listed distribution on without asking the server: %s', async (name, status) => {
    const store = await load()
    store.setList([distribution('dist-1', 'waiting'), distribution('dist-2', 'waiting')] as never)

    notify(name, { id: 'dist-1' })
    await vi.waitFor(() => expect(store.list[0].status).toBe(status))

    expect(store.list[1].status).toBe('waiting')
    expect(server.requests).toEqual([])
  })

  const finished: Array<[string, string]> = [
    ['distribution_distributed', 'distributed'],
    ['distribution_failed', 'failed'],
  ]

  it.each(finished)('reads the finished distribution again and puts it in its place: %s', async (name, status) => {
    const store = await load()
    store.setList([distribution('dist-1', 'distributing'), distribution('dist-2', 'waiting')] as never)
    server.on('GET', /^\/adm\/v1\/distribution\/dist-1$/, () => ({
      status: 200,
      data: distribution('dist-1', status, { extId: 'remote-7' }),
    }))

    notify(name, { id: 'dist-1' })
    await vi.waitFor(() => expect(store.list[0].status).toBe(status))

    // The whole record, not only its status: the finished one carries what the service answered with.
    expect(store.list[0].extId).toBe('remote-7')
    expect(store.list.map((item) => item.id)).toEqual(['dist-1', 'dist-2'])
    expect(server.sent('GET', /\/distribution\/dist-1$/)).toHaveLength(1)
  })

  it('leaves the list as it is when the finished distribution cannot be read', async () => {
    const store = await load()
    store.setList([distribution('dist-1', 'distributing')] as never)
    server.on('GET', /^\/adm\/v1\/distribution\/dist-1$/, () => {
      throw new Error('the distribution service is down')
    })

    notify('distribution_distributed', { id: 'dist-1' })
    await vi.waitFor(() => expect(server.sent('GET', /\/distribution\/dist-1$/)).toHaveLength(1))
    await Promise.resolve()

    expect(store.list[0].status).toBe('distributing')
  })

  it('changes nothing for a distribution the list does not show', async () => {
    const store = await load()
    store.setList([distribution('dist-1', 'waiting')] as never)

    notify('distribution_distributing', { id: 'dist-9' })
    await Promise.resolve()

    expect(store.list.map((item) => [item.id, item.status])).toEqual([['dist-1', 'waiting']])
  })
})

describe('a notification that a distribution service was signed in to', () => {
  it.each([
    [true, 'success'],
    [false, 'error'],
  ])('records the outcome for the service (success %s)', async (success, status) => {
    const store = await load()

    notify('distribution_authorized', { distributionService: 'youtube_main', success })

    expect(store.getDistributionAuth('youtube_main')).toEqual({ distributionService: 'youtube_main', status })
    expect(store.getDistributionAuth('jw_main')).toBeNull()
  })

  it('writes over the state the dialog was waiting in', async () => {
    const store = await load()
    store.setAuthStatus('youtube_main', 'waiting_for_login')

    notify('distribution_authorized', { distributionService: 'youtube_main', success: true })

    expect(store.auth).toEqual([{ distributionService: 'youtube_main', status: 'success' }])
  })
})

describe('a notification that the user was updated', () => {
  it('reads the current user again', async () => {
    await load()
    const user = { id: 7, email: 'editor@dam.test', roles: [], permissions: {}, permissionGroups: [] }
    server.on('GET', /^\/adm\/users\/current$/, () => ({ status: 200, data: user }))
    const { useAuth } = await import('@/domains/system/auth/auth')
    const { useCurrentUser } = useAuth()
    const { currentUser } = useCurrentUser('dam')

    notify('user_updated', {})
    await vi.waitFor(() => expect(currentUser.value?.id).toBe(7))

    expect(server.requests.map((request) => [request.method, request.url])).toEqual([['GET', '/adm/users/current']])
  })
})
