import { HTTP_STATUS_UNAUTHORIZED, endSession } from '@anzusystems/common-admin'
import type { AxiosError } from 'axios'

import { AUTH_PATH_PREFIX } from '@/domains/system/auth/authPath'
import { logoutUser } from '@/domains/system/composables/currentUser'

// A 401 from the auth endpoints does not mean a lost session.
// The refresh interceptor handles the token refresh's 401 and
// logs out once. The sign-in form handles a refused sign-in.
const isAuthRequest = (errorResponse: AxiosError) => errorResponse.config?.url?.startsWith(AUTH_PATH_PREFIX) === true

// Once per ended session, with the refresh interceptor: a page kept for its unsaved changes is not sent again.
const logoutUserResponseInterceptor = (errorResponse: AxiosError) => {
  if (errorResponse.response?.status === HTTP_STATUS_UNAUTHORIZED && !isAuthRequest(errorResponse)) {
    endSession(logoutUser)
  }
  return Promise.reject(errorResponse)
}

export { logoutUserResponseInterceptor }
