import { createRefreshRequestInterceptor, createRefreshSession } from '@anzusystems/common-admin'

import { useRefreshToken } from '@/domains/system/auth/authApi'
import { AUTH_PATH_PREFIX } from '@/domains/system/auth/authPath'
import { logoutUser } from '@/domains/system/composables/currentUser'
import { getAuthCookieState } from '@/shared/apiClients/authCookies'

// The refresh rules live in the library: one refresh for concurrent requests.
// Logout only when the session is really gone: a 401, or a 400 when no other tab rotated the token.
// When the auth backend cannot answer, it rejects with `AuthUnavailableError` and does not log out.
export const refreshSession = createRefreshSession({
  // `body: {}` is deliberate. labs skips the body entirely when `body` is undefined.
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
