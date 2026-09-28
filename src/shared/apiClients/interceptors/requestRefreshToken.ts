import { createRefreshRequestInterceptor, createRefreshSession } from '@anzusystems/common-admin'

import { useRefreshToken } from '@/domains/system/auth/authApi'
import { AUTH_PATH_PREFIX } from '@/domains/system/auth/authPath'
import { logoutUser } from '@/domains/system/composables/currentUser'
import { getAuthCookieState } from '@/shared/apiClients/authCookies'

// The refresh and its rules live in the library: one refresh for concurrent requests, a logout only
// when the session is really gone (401, or a 400 while no other tab rotated the token), and a
// rejection with `AuthUnavailableError` -- no logout -- when the auth backend cannot answer.
export const refreshSession = createRefreshSession({
  // `body: {}` is deliberate: legacy `apiAnyRequest` was called with `{}` and labs skips the body
  // entirely when `body` is undefined.
  refresh: () => useRefreshToken().execute({ body: {} }),
  jwtPayload: () => getAuthCookieState().jwtPayload,
})

const { interceptor: userRefreshRequestInterceptor } = createRefreshRequestInterceptor({
  cookies: getAuthCookieState,
  refreshSession,
  logout: logoutUser,
  skipUrlPrefix: AUTH_PATH_PREFIX,
})

export { userRefreshRequestInterceptor }
