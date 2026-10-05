import { AnzuApiAxiosError, AnzuApiTimeoutError, AnzuFatalError, AuthUnavailableError } from '@anzusystems/common-admin'
import { AxiosError } from 'axios'
import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// What the installed one answers: the user on success, `undefined` on any failure - and a failure leaves whoever was
// there before in the store.
const fetchCurrentUser = vi.fn(async (): Promise<unknown> => undefined)
const loadDamPrvConfig = vi.fn(async (): Promise<unknown> => undefined)
const loadDamConfigExtSystem = vi.fn(async (): Promise<unknown> => undefined)
const loadDamConfigAssetCustomFormElements = vi.fn(async (): Promise<unknown> => undefined)
const currentUser = { value: undefined as unknown }
const isSuperAdmin = { value: false }
const canSafe = vi.fn((): boolean => true)
const checkAbility = vi.fn(async (): Promise<unknown> => undefined)

vi.mock('@/domains/system/auth/auth', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useAuth: () => ({ canSafe, useCurrentUser: () => ({ fetchCurrentUser, currentUser, isSuperAdmin }) }),
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
  isSuperAdmin.value = false
  canSafe.mockReturnValue(true)
  loadDamPrvConfig.mockResolvedValue(undefined)
  loadDamConfigExtSystem.mockResolvedValue(undefined)
  loadDamConfigAssetCustomFormElements.mockResolvedValue(undefined)
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

const responseError = (status: number) =>
  new AnzuApiAxiosError(new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse))

// The user read is the one that tells a session that is gone from a backend that is not answering: a valid
// session sent to the sign-in form only comes back to the same failure after the SSO round trip.
describe('a user read that fails because nothing answers', () => {
  it('asks for the failure itself, not just an empty answer', async () => {
    const { createAppInitialize } = await load()
    await createAppInitialize(route())

    expect(fetchCurrentUser).toHaveBeenCalledWith(expect.anything(), '/adm/users/current', undefined, 'user', {
      throwOnError: true,
    })
  })

  it.each([
    [
      'the sign-in server does not answer the token refresh',
      new AnzuFatalError(new AuthUnavailableError(new Error('503'))),
    ],
    ['the request times out', new AnzuApiTimeoutError()],
    ['core-dam answers a 5xx', responseError(503)],
    ['there is no response at all', new AnzuApiAxiosError(new AxiosError('Network Error', 'ERR_NETWORK'))],
  ])('shows the error page when %s', async (_label, failure) => {
    const { createAppInitialize } = await load()
    fetchCurrentUser.mockRejectedValue(failure)

    expect(await createAppInitialize(route())).toBe('/error')
  })

  it.each([401, 403, 404])('still sends a %i to sign in', async (status) => {
    const { createAppInitialize } = await load()
    fetchCurrentUser.mockRejectedValue(responseError(status))

    expect(await createAppInitialize(route())).toBe('/login')
  })
})

// The loaders reject with a bare `false` whatever the status was; the backend lets only an admin or a user of the ext
// system read its configuration, under dam_extSystem_read, dam_customFormElement_read and dam_assetCustomForm_read.
describe('an ext system configuration that will not load', () => {
  const member = { id: 1, adminToExtSystems: [], userToExtSystems: [1] }

  it.each([
    ['the configuration', loadDamConfigExtSystem],
    ['the custom form elements', loadDamConfigAssetCustomFormElements],
  ])('names the ext system when %s fails for a user who is not on it', async (_label, loader) => {
    const { createAppInitialize, useAppInitialize } = await load()
    currentUser.value = { ...member, userToExtSystems: [2] }
    loader.mockRejectedValue(false)

    expect(await createAppInitialize(route())).toBe('/error')
    expect(useAppInitialize().accessDeniedExtSystemId.value).toBe(1)
  })

  it('names the ext system when a permission to read it is missing', async () => {
    const { createAppInitialize, useAppInitialize } = await load()
    currentUser.value = member
    canSafe.mockReturnValue(false)
    loadDamConfigExtSystem.mockRejectedValue(false)

    expect(await createAppInitialize(route())).toBe('/error')
    expect(useAppInitialize().accessDeniedExtSystemId.value).toBe(1)
    expect(canSafe).toHaveBeenCalledWith([
      'dam_extSystem_read',
      'dam_customFormElement_read',
      'dam_assetCustomForm_read',
    ])
  })

  it.each([
    ['a member with the permissions', false],
    ['a super admin', true],
  ])('keeps the generic error page for %s', async (_label, superAdmin) => {
    const { createAppInitialize, useAppInitialize } = await load()
    currentUser.value = superAdmin ? { ...member, userToExtSystems: [] } : member
    isSuperAdmin.value = superAdmin
    canSafe.mockReturnValue(!superAdmin)
    loadDamConfigExtSystem.mockRejectedValue(false)

    expect(await createAppInitialize(route())).toBe('/error')
    expect(useAppInitialize().accessDeniedExtSystemId.value).toBeUndefined()
  })

  it('forgets the verdict on the next attempt', async () => {
    const { createAppInitialize, useAppInitialize } = await load()
    currentUser.value = { ...member, userToExtSystems: [] }
    loadDamConfigExtSystem.mockRejectedValueOnce(false)
    await createAppInitialize(route())

    currentUser.value = member
    await createAppInitialize(route())

    expect(useAppInitialize().accessDeniedExtSystemId.value).toBeUndefined()
  })
})
