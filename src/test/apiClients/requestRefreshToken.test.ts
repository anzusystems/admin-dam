import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const executeRefresh = vi.fn(async (): Promise<unknown> => undefined)
const logoutUser = vi.fn()

let refreshTokenExists: string | undefined = 'yes'
let jwtPayload: string | undefined = 'payload'

vi.mock('@/domains/system/auth/authApi', () => ({
  useRefreshToken: () => ({ execute: executeRefresh }),
  AUTH_PATH_PREFIX: '/auth',
}))
vi.mock('@/shared/apiClients/authCookies', () => ({
  getAuthCookieState: () => ({ refreshTokenExists, jwtPayload }),
}))
vi.mock('@/domains/system/composables/currentUser', () => ({ logoutUser }))

const load = async () => {
  vi.resetModules()

  return await import('@/shared/apiClients/interceptors/requestRefreshToken')
}

const config = { url: '/adm/v1/asset' } as never

// A failed refresh as the api helpers deliver it: the axios error wrapped once.
const failing = (status: number) => {
  const error = new AxiosError('request failed')
  error.response = { status, statusText: '', data: {}, headers: {}, config: { headers: new AxiosHeaders() } }
  return Object.assign(new Error('wrapped'), { cause: error })
}

beforeEach(() => {
  vi.clearAllMocks()
  executeRefresh.mockImplementation(async () => undefined)
  refreshTokenExists = 'yes'
  jwtPayload = 'payload'
})

describe('the refresh interceptor', () => {
  it('lets a request with a token through untouched', async () => {
    const { userRefreshRequestInterceptor } = await load()

    await expect(userRefreshRequestInterceptor(config)).resolves.toBe(config)
    expect(executeRefresh).not.toHaveBeenCalled()
  })

  it('signs the user out when both cookies are gone', async () => {
    const { userRefreshRequestInterceptor } = await load()
    refreshTokenExists = undefined
    jwtPayload = undefined

    await expect(userRefreshRequestInterceptor(config)).rejects.toBeDefined()

    expect(logoutUser).toHaveBeenCalledTimes(1)
    expect(executeRefresh).not.toHaveBeenCalled()
  })

  it('refreshes once for all the requests waiting on it, and releases them all', async () => {
    const { userRefreshRequestInterceptor } = await load()
    jwtPayload = undefined

    const waiting = [
      userRefreshRequestInterceptor(config),
      userRefreshRequestInterceptor(config),
      userRefreshRequestInterceptor(config),
    ]

    await expect(Promise.all(waiting)).resolves.toEqual([config, config, config])
    expect(executeRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not release a later request with an earlier refresh', async () => {
    const { userRefreshRequestInterceptor } = await load()
    jwtPayload = undefined
    await userRefreshRequestInterceptor(config)

    let finish: () => void = () => {}
    executeRefresh.mockImplementation(() => new Promise<undefined>((resolve) => (finish = () => resolve(undefined))))
    let second = 'pending'
    const request = userRefreshRequestInterceptor(config).then(() => (second = 'released'))
    await new Promise((resolve) => setTimeout(resolve, 0))

    // It waits for its own refresh; the finished one is never reused.
    expect(second).toBe('pending')
    finish()
    await request
    expect(second).toBe('released')
    expect(executeRefresh).toHaveBeenCalledTimes(2)
  })

  it('does not strand a request made from the one it just released', async () => {
    const { userRefreshRequestInterceptor } = await load()
    jwtPayload = undefined
    let second = 'pending'

    // The continuation of a released request runs as a microtask, before a `finally` attached after the flush would
    // have lowered the flag.
    await Promise.resolve(userRefreshRequestInterceptor(config)).then(async () => {
      await Promise.resolve(userRefreshRequestInterceptor(config))
      second = 'released'
    })

    expect(second).toBe('released')
    expect(executeRefresh).toHaveBeenCalledTimes(2)
  })

  it('signs the user out and rejects the queue when the session is refused (400, no other tab refreshed)', async () => {
    const { userRefreshRequestInterceptor } = await load()
    jwtPayload = undefined
    executeRefresh.mockRejectedValue(failing(400))

    const waiting = [userRefreshRequestInterceptor(config), userRefreshRequestInterceptor(config)]

    const results = await Promise.allSettled(waiting)

    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected'])
    expect(logoutUser).toHaveBeenCalledTimes(1)
  })

  it('rejects the queue but keeps the user signed in when the auth backend cannot answer', async () => {
    const { userRefreshRequestInterceptor } = await load()
    jwtPayload = undefined
    executeRefresh.mockRejectedValue(failing(503))

    const results = await Promise.allSettled([userRefreshRequestInterceptor(config)])

    expect(results.map((result) => result.status)).toEqual(['rejected'])
    expect(logoutUser).not.toHaveBeenCalled()
  })

  it('starts a new refresh once the previous one has settled', async () => {
    const { userRefreshRequestInterceptor } = await load()
    jwtPayload = undefined
    // A refresh that succeeds writes the cookie, which is what takes later requests off this path.
    executeRefresh.mockImplementation(async () => {
      jwtPayload = 'payload'
    })

    await userRefreshRequestInterceptor(config)
    // A full turn, so the whole flush has settled before the second request is made.
    await new Promise((resolve) => setTimeout(resolve, 0))

    // The token expires again later in the same session.
    jwtPayload = undefined
    await userRefreshRequestInterceptor(config)

    expect(executeRefresh).toHaveBeenCalledTimes(2)
  })
})
