import { beforeEach, describe, expect, it, vi } from 'vitest'

const post = vi.fn(async () => undefined)
const create = vi.fn(() => ({ post }))
const damClient = vi.fn()

vi.mock('axios', () => ({ default: { create: () => create() } }))
// Mocked so the test can prove the log never travels on the authenticated client.
vi.mock('@/shared/apiClients/damClient', () => ({ damClient }))

const load = async () => {
  vi.resetModules()
  const { envConfig } = await import('@/shared/EnvConfigService')
  envConfig.apiLogError.enabled = true
  envConfig.apiLogError.apiUrl = 'https://logs.test/errors'

  return await import('@/shared/ErrorHandlerApiService')
}

beforeEach(() => {
  vi.clearAllMocks()
  post.mockResolvedValue(undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('createLog', () => {
  it('sends the log on a client of its own', async () => {
    const { createLog } = await load()

    createLog('boom', 'stack')

    // The log endpoint is an absolute url, so the auth interceptor's `runWhen` filter does not exclude it: on
    // `damClient` a 401 on a log request signed the user out.
    expect(post).toHaveBeenCalledTimes(1)
    expect(damClient).not.toHaveBeenCalled()
  })

  it('builds that client once', async () => {
    const { createLog } = await load()

    createLog('one', '')
    createLog('two', '')

    expect(create).toHaveBeenCalledTimes(1)
  })

  it('attaches a rejection handler to the log request', async () => {
    const { createLog } = await load()
    // The call site is fire-and-forget, so nothing downstream would ever attach one - and a
    // rejected log request would surface as an unhandled rejection.
    const settled = { catch: vi.fn(() => Promise.resolve()) }
    post.mockReturnValueOnce(settled as never)

    createLog('boom', 'stack')

    expect(settled.catch).toHaveBeenCalledTimes(1)
  })

  it('says nothing when there is nothing to say', async () => {
    const { createLog } = await load()

    createLog('', '', undefined, '')

    expect(post).not.toHaveBeenCalled()
  })
})
