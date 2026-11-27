import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { START_LOCATION } from 'vue-router'

const loadDamPubConfig = vi.fn(async (): Promise<unknown> => undefined)
const checkAbility = vi.fn(async (): Promise<unknown> => undefined)
const createAppInitialize = vi.fn(async (): Promise<unknown> => true)
const initialized = ref({ damPubConfig: false })
const accessDeniedExtSystemId = ref<number | undefined>(undefined)
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
    accessDeniedExtSystemId,
  }),
}))
vi.mock('@/router/checkAbility', () => ({ checkAbility: () => checkAbility() }))
vi.mock('@/loadLanguageMessages', () => ({
  initLanguageMessagesLoaded: { value: true },
  initLoadLanguageMessages: vi.fn(),
}))
vi.mock('@/shared/apiClients/damClient', () => ({ damClient: vi.fn() }))
const openAppPath = vi.fn()
vi.mock('@/router/errorPage', async (importOriginal) => ({
  ...((await importOriginal()) as Record<string, unknown>),
  openAppPath: (...args: unknown[]) => openAppPath(...args),
}))

const protectedRoute = {
  path: '/assets',
  fullPath: '/assets?licence=2#type=image&text=a%26b',
  query: { licence: '2' },
  meta: { requiresAuth: true },
} as never
const publicRoute = { path: '/login', meta: { requiresAuth: false } } as never
const errorRoute = { path: '/error', query: {}, meta: { requiresAuth: false } } as never
const errorRouteFor = (redirect: string) => ({ ...(errorRoute as object), query: { redirect } }) as never
const failedAt = { path: '/error', query: { redirect: '/assets?licence=2#type=image&text=a%26b' } }

const fromNowhere = { path: '/', name: undefined, meta: {} } as never

const load = async () => {
  vi.resetModules()

  return await import('@/router/beforeEachRoute')
}

beforeEach(() => {
  vi.clearAllMocks()
  loadDamPubConfig.mockResolvedValue(undefined)
  checkAbility.mockResolvedValue(undefined)
  initialized.value = { damPubConfig: false }
  accessDeniedExtSystemId.value = undefined
  appInitialized = false
  hasAuthCookie = true
})

describe('the route guard', () => {
  it('checks the route permissions once the application is running', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }
    appInitialized = true
    checkAbility.mockResolvedValue('/unauthorized')

    expect(await beforeEachRoute(protectedRoute, fromNowhere)).toBe('/unauthorized')
    expect(checkAbility).toHaveBeenCalledTimes(1)
  })

  // With the address that failed to open: a retry used to land on the home page and drop the filter.
  it('sends a start-up that cannot read the configuration to the error page', async () => {
    const { beforeEachRoute } = await load()
    loadDamPubConfig.mockRejectedValue(new Error('502'))

    expect(await beforeEachRoute(protectedRoute, fromNowhere)).toEqual(failedAt)
  })

  it('gives the error page of a failed start-up the address that failed to open', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }
    createAppInitialize.mockResolvedValueOnce('/error')

    expect(await beforeEachRoute(protectedRoute, fromNowhere)).toEqual(failedAt)
  })

  // A retry of the same link is refused again: the error page goes to the home page, as before.
  it('gives the error page no address when the start-up was refused the ext system', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }
    createAppInitialize.mockImplementationOnce(async () => {
      accessDeniedExtSystemId.value = 3
      return '/error'
    })

    expect(await beforeEachRoute(protectedRoute, fromNowhere)).toBe('/error')
  })

  it('leaves every other answer of the start-up alone', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }
    createAppInitialize.mockResolvedValueOnce('/unauthorized')

    expect(await beforeEachRoute(protectedRoute, fromNowhere)).toBe('/unauthorized')
  })

  it('still refuses a forbidden route when the configuration fails under a running application', async () => {
    const { beforeEachRoute } = await load()
    appInitialized = true
    loadDamPubConfig.mockRejectedValue(new Error('502'))
    checkAbility.mockResolvedValue('/unauthorized')

    // Answering the navigation here would skip the guard below on one failed configuration load.
    expect(await beforeEachRoute(protectedRoute, fromNowhere)).toBe('/unauthorized')
    expect(checkAbility).toHaveBeenCalledTimes(1)
  })

  it('does not throw a running application away over one failed load', async () => {
    const { beforeEachRoute } = await load()
    appInitialized = true
    loadDamPubConfig.mockRejectedValue(new Error('502'))

    // The error page recovers with a full reload, which would drop the upload queue.
    expect(await beforeEachRoute(protectedRoute, fromNowhere)).toBeUndefined()
    expect(checkAbility).toHaveBeenCalledTimes(1)
  })

  it('lets the error page itself through', async () => {
    const { beforeEachRoute } = await load()
    loadDamPubConfig.mockRejectedValue(new Error('502'))

    // Redirecting to the page the user is already on is a loop the router never leaves.
    expect(await beforeEachRoute(errorRoute, fromNowhere)).toBeUndefined()
  })

  it('runs the start-up again when the error page is reloaded', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }

    expect(await beforeEachRoute(errorRoute, START_LOCATION)).toEqual({ path: '/' })
  })

  // Loaded as a document: a router redirect would re-encode the hash, and `%26` in a filter would become `&`.
  it('opens the page that failed to open when the error page is reloaded', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }
    const target = '/assets?licence=2#type=image&text=a%26b'

    expect(await beforeEachRoute(errorRouteFor(target), START_LOCATION)).toBe(false)
    expect(openAppPath).toHaveBeenCalledWith(target, { replace: true })
  })

  it.each(['//example.com/x', '/\\example.com', '/\t/example.com', 'https://example.com', 'assets'])(
    'does not leave the application for %s',
    async (target) => {
      const { beforeEachRoute } = await load()
      initialized.value = { damPubConfig: true }

      expect(await beforeEachRoute(errorRouteFor(target), START_LOCATION)).toEqual({ path: '/' })
      expect(openAppPath).not.toHaveBeenCalled()
    }
  )

  it('keeps the error page when the start-up that just failed sent the user there', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }

    expect(
      await beforeEachRoute({ ...(errorRoute as object), redirectedFrom: protectedRoute } as never, START_LOCATION)
    ).toBeUndefined()
  })

  it('leaves a public route alone', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }

    expect(await beforeEachRoute(publicRoute, fromNowhere)).toBeUndefined()
    expect(checkAbility).not.toHaveBeenCalled()
    expect(createAppInitialize).not.toHaveBeenCalled()
  })

  it('starts the application up when it has a cookie but has not run yet', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }

    await beforeEachRoute(protectedRoute, fromNowhere)

    expect(createAppInitialize).toHaveBeenCalledTimes(1)
  })

  it('sends a visitor with no cookie to sign in', async () => {
    const { beforeEachRoute } = await load()
    initialized.value = { damPubConfig: true }
    hasAuthCookie = false

    expect(await beforeEachRoute(protectedRoute, fromNowhere)).toBe('/login')
  })
})
