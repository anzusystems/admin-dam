import { sessionLive } from '@anzusystems/common-admin'
import { AxiosError, AxiosHeaders } from 'axios'
import type { AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// A 401 of the token refresh itself is handled by the refresh interceptor, which logs out.
// This handler used to log out a second time. It logs out through the library's `endSession`, once per ended
// session: a page the user kept for its unsaved changes would otherwise be asked again on every request.

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

beforeEach(() => {
  logoutUser.mockClear()
  // A new sign-in: the page's session works again.
  sessionLive(`signed-in-${Math.random()}`)
})

describe('the logout on a 401', () => {
  it('logs out for a request of the application', async () => {
    await expect(logoutUserResponseInterceptor(unauthorized('/adm/v1/users/current'))).rejects.toBeInstanceOf(
      AxiosError
    )
    expect(logoutUser).toHaveBeenCalledTimes(1)
  })

  it('leaves the token refresh to the refresh interceptor', async () => {
    await expect(logoutUserResponseInterceptor(unauthorized('/auth/refresh-token'))).rejects.toBeInstanceOf(AxiosError)
    expect(logoutUser).not.toHaveBeenCalled()
  })

  it('logs out once for the 401s of one ended session', async () => {
    for (const url of ['/adm/v1/users/current', '/adm/v1/asset/1', '/adm/v1/asset-licence/2']) {
      await expect(logoutUserResponseInterceptor(unauthorized(url))).rejects.toBeInstanceOf(AxiosError)
    }
    expect(logoutUser).toHaveBeenCalledTimes(1)
  })
})
