import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const loadDamPubConfig = vi.fn(async (): Promise<unknown> => undefined)
const checkAbility = vi.fn(async (): Promise<unknown> => undefined)
const createAppInitialize = vi.fn(async (): Promise<unknown> => true)
const initialized = ref({ damPubConfig: false })
let appInitialized = false
let hasAuthCookie = true

vi.mock('@anzusystems/common-admin', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  useDamConfigState: () => ({ loadDamPubConfig }),
  useDamConfigStore: () => ({ initialized }),
}))
vi.mock('@/domains/system/composables/appInitialize', () => ({
  createAppInitialize: () => createAppInitialize(),
  useAppInitialize: () => ({
    isAppInitialized: () => appInitialized,
    hasAppAuthCookie: () => hasAuthCookie,
  }),
}))
vi.mock('@/router/checkAbility', () => ({ checkAbility: () => checkAbility() }))
vi.mock('@/loadLanguageMessages', () => ({
  initLanguageMessagesLoaded: { value: true },
  initLoadLanguageMessages: vi.fn(),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))

const protectedRoute = { path: '/assets', meta: { requiresAuth: true } } as never
const publicRoute = { path: '/login', meta: { requiresAuth: false } } as never
const errorRoute = { path: '/error', meta: { requiresAuth: false } } as never

const load = async () => {
  vi.resetModules()

  return await import('@/router/beforeEachRoute')
}

beforeEach(() => {
  vi.clearAllMocks()
  loadDamPubConfig.mockResolvedValue(undefined)
  checkAbility.mockResolvedValue(undefined)
  initialized.value = { damPubConfig: false }
  appInitialized = false
  hasAuthCookie = true
})

describe('the route guard', () => {
  it('checks the route permissions once the application is running', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }
    appInitialized = true
    checkAbility.mockResolvedValue('/unauthorized')

    // Calling it is not enough: what it answers has to be what the router is told.
    expect(await beforeEachRoute(protectedRoute)).toBe('/unauthorized')
    expect(checkAbility).toHaveBeenCalledTimes(1)
  })

  it('sends a start-up that cannot read the configuration to the error page', async () => {
    const { beforeEachRoute } = await load()
    loadDamPubConfig.mockRejectedValue(new Error('502'))

    expect(await beforeEachRoute(protectedRoute)).toBe('/error')
  })

  it('still refuses a forbidden route when the configuration fails under a running application', async () => {
    const { beforeEachRoute } = await load()
    appInitialized = true
    loadDamPubConfig.mockRejectedValue(new Error('502'))
    checkAbility.mockResolvedValue('/unauthorized')

    // Answering the navigation here would skip the guard below, on one failed configuration load.
    expect(await beforeEachRoute(protectedRoute)).toBe('/unauthorized')
    expect(checkAbility).toHaveBeenCalledTimes(1)
  })

  it('does not throw a running application away over one failed load', async () => {
    const { beforeEachRoute } = await load()
    appInitialized = true
    loadDamPubConfig.mockRejectedValue(new Error('502'))

    // The error page recovers with a full reload, which would take the upload queue with it.
    expect(await beforeEachRoute(protectedRoute)).not.toBe('/error')
  })

  it('lets the error page itself through', async () => {
    const { beforeEachRoute } = await load()
    loadDamPubConfig.mockRejectedValue(new Error('502'))

    // Redirecting to the page the user is already on is a loop the router never leaves.
    expect(await beforeEachRoute(errorRoute)).toBeUndefined()
  })

  it('leaves a public route alone', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }

    expect(await beforeEachRoute(publicRoute)).toBeUndefined()
    expect(checkAbility).not.toHaveBeenCalled()
    expect(createAppInitialize).not.toHaveBeenCalled()
  })

  it('starts the application up when it has a cookie but has not run yet', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }

    await beforeEachRoute(protectedRoute)

    expect(createAppInitialize).toHaveBeenCalledTimes(1)
  })

  it('sends a visitor with no cookie to sign in', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }
    hasAuthCookie = false

    expect(await beforeEachRoute(protectedRoute)).toBe('/login')
  })
})
