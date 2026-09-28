import { AxiosError, AxiosHeaders } from 'axios'
import type { AxiosResponse } from 'axios'
import { describe, expect, it, vi } from 'vitest'

// A 401 of the token refresh itself is the refresh interceptor's to answer, and it logs out; this one logged
// out a second time.

const logoutUser = vi.fn()
vi.mock('@/domains/system/composables/currentUser', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  logoutUser,
}))

const { logoutUserResponseInterceptor } = await import('@/shared/apiClients/interceptors/responseLogoutUser')

const unauthorized = (url: string) =>
  new AxiosError('unauthorized', 'ERR_BAD_REQUEST', { url, headers: new AxiosHeaders() }, undefined, {
    status: 401,
  } as AxiosResponse)

describe('the logout on a 401', () => {
  it('logs out for a request of the application', async () => {
    logoutUser.mockClear()
    await expect(logoutUserResponseInterceptor(unauthorized('/adm/v1/users/current'))).rejects.toBeInstanceOf(
      AxiosError
    )
    expect(logoutUser).toHaveBeenCalledTimes(1)
  })

  it('leaves the token refresh to the refresh interceptor', async () => {
    logoutUser.mockClear()
    await expect(logoutUserResponseInterceptor(unauthorized('/auth/refresh-token'))).rejects.toBeInstanceOf(AxiosError)
    expect(logoutUser).not.toHaveBeenCalled()
  })
})
