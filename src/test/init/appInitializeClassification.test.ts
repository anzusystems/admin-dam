import { beforeEach, describe, expect, it, vi } from 'vitest'

// What the installed one answers: the user on success, `undefined` on any failure - and a failure leaves whoever was
// there before in the store.
const fetchCurrentUser = vi.fn(async (): Promise<unknown> => undefined)
const loadDamPrvConfig = vi.fn(async (): Promise<unknown> => undefined)
const loadDamConfigExtSystem = vi.fn(async (): Promise<unknown> => undefined)
const loadDamConfigAssetCustomFormElements = vi.fn(async (): Promise<unknown> => undefined)
const currentUser = { value: undefined as unknown }
const checkAbility = vi.fn(async (): Promise<unknown> => undefined)

vi.mock('@/domains/system/auth/auth', () => ({
  useAuth: () => ({ useCurrentUser: () => ({ fetchCurrentUser, currentUser }) }),
}))
vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigState: () => ({
    loadDamPrvConfig,
    loadDamConfigExtSystem,
    loadDamConfigAssetCustomFormElements,
    getDamConfigExtSystem: () => ({ image: { enabled: true } }),
  }),
}))
vi.mock('@/domains/coreDam/asset/composables/currentExtSystem', () => ({
  initCurrentExtSystemAndLicence: vi.fn(async () => true),
  useCurrentExtSystem: () => ({ currentExtSystemId: { value: 1 } }),
}))
vi.mock('@/router/checkAbility', () => ({ checkAbility: () => checkAbility() }))
vi.mock('@/domains/system/composables/appNotificationListeners', () => ({
  initAppNotificationListeners: vi.fn(),
}))
vi.mock('@/shared/apiClients/authCookies', () => ({ getAuthCookieState: () => ({}) }))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))

// What the installed `loadDamPrvConfig` really rejects with.
const CONFIG_REJECTION = false

const route = (query: Record<string, string> = {}) =>
  ({ path: '/assets', name: '/(coreDam)/assets', params: {}, query, meta: {} }) as never

const load = async () => {
  vi.resetModules()

  return await import('@/domains/system/composables/appInitialize')
}

beforeEach(() => {
  vi.clearAllMocks()
  currentUser.value = { id: 1 }
  loadDamPrvConfig.mockResolvedValue(undefined)
  fetchCurrentUser.mockResolvedValue({ id: 1 })
})

describe('a start-up the sign-in has already refused', () => {
  it('is answered before the start-up fetches anything', async () => {
    const { createAppInitialize } = await load()

    expect(await createAppInitialize(route({ loginState: 'failure-unauthorized' }))).toBe('/unauthorized')
    // The private config is a protected endpoint, so for this user it is the request most likely to fail - and its
    // failure used to send the user to the sign-in screen before this verdict was read.
    expect(loadDamPrvConfig).not.toHaveBeenCalled()
    expect(fetchCurrentUser).not.toHaveBeenCalled()
  })
})

describe('a private configuration that will not load', () => {
  it('waits for the current-user answer before calling it an outage', async () => {
    const { createAppInitialize } = await load()
    loadDamPrvConfig.mockRejectedValue(CONFIG_REJECTION)
    // The slower of the two, and the only one whose answer can rule a sign-in problem out.
    fetchCurrentUser.mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))

      return undefined
    })

    // Giving up on the first rejection left this answer unread and every failure looked the same.
    expect(await createAppInitialize(route())).toBe('/login')
    expect(fetchCurrentUser).toHaveBeenCalledTimes(1)
  })

  it('still calls an outage an outage', async () => {
    const { createAppInitialize } = await load()
    loadDamPrvConfig.mockRejectedValue(CONFIG_REJECTION)

    // The user is readable, which rules out the sign-in problem; what this is instead is unknown.
    expect(await createAppInitialize(route())).toBe('/error')
  })
})

describe('a user the configuration knows nothing about', () => {
  it('is sent to sign in whatever the sign-in said', async () => {
    const { createAppInitialize } = await load()
    fetchCurrentUser.mockResolvedValue(undefined)

    // Listing only the failure statuses left `success` out, so a user who signed in and has no account in DAM carried
    // on into the ext-system load.
    expect(await createAppInitialize(route({ loginState: 'success' }))).toBe('/login')
  })

  it('is not mistaken for the user the last attempt read', async () => {
    const { createAppInitialize } = await load()
    // Left behind by an earlier start-up that got this far and then bailed out.
    currentUser.value = { id: 1 }
    fetchCurrentUser.mockResolvedValue(undefined)

    expect(await createAppInitialize(route())).toBe('/login')
  })
})
