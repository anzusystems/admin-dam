import { beforeEach, describe, expect, it, vi } from 'vitest'

const requestUse = vi.fn()
const responseUse = vi.fn()
const create = vi.fn(() => ({
  interceptors: { request: { use: requestUse }, response: { use: responseUse } },
}))

vi.mock('axios', () => ({ default: { create: () => create() } }))
vi.mock('@/shared/apiClients/interceptors/requestRefreshToken', () => ({
  userRefreshRequestInterceptor: vi.fn(),
}))
vi.mock('@/shared/apiClients/interceptors/responseLogoutUser', () => ({
  logoutUserResponseInterceptor: vi.fn(),
}))

const load = async () => {
  vi.resetModules()

  return await import('@/shared/apiClients/damClient')
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('damClient', () => {
  it('builds the instance once and hands the same one back', async () => {
    const { damClient } = await load()

    expect(damClient()).toBe(damClient())
    expect(create).toHaveBeenCalledTimes(1)
  })

  it('registers its interceptors once, however many times it is called', async () => {
    const { damClient } = await load()

    damClient()
    damClient()
    damClient()

    // This is a factory, and chunked uploads call it once per chunk: registering outside the null guard grew
    // `interceptors.request.handlers` for as long as the tab stayed open.
    expect(requestUse).toHaveBeenCalledTimes(1)
    expect(responseUse).toHaveBeenCalledTimes(1)
  })

  it('keeps the token refresh off the two paths that would recurse into it', async () => {
    const { damClient } = await load()
    damClient()

    const runWhen = requestUse.mock.calls[0][2].runWhen

    // `/auth` performs the refresh itself, `/pub` is unauthenticated configuration.
    expect(runWhen({ url: '/auth/refresh-token' })).toBe(false)
    expect(runWhen({ url: '/pub/v1/configuration' })).toBe(false)
    expect(runWhen({ url: '/adm/v1/asset' })).toBe(true)
  })
})
