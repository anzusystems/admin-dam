import { HTTP_STATUS_UNAUTHORIZED } from '@anzusystems/common-admin'
import type { AxiosError } from 'axios'

import { AUTH_PATH_PREFIX } from '@/domains/system/auth/authPath'
import { logoutUser } from '@/domains/system/composables/currentUser'

// A 401 of the auth endpoints is not a request of a lost session: the token refresh's is the refresh interceptor's
// to answer (it logs out, once), a refused sign-in the sign-in form's.
const isAuthRequest = (errorResponse: AxiosError) => errorResponse.config?.url?.startsWith(AUTH_PATH_PREFIX) === true

const logoutUserResponseInterceptor = (errorResponse: AxiosError) => {
  if (errorResponse.response?.status === HTTP_STATUS_UNAUTHORIZED && !isAuthRequest(errorResponse)) logoutUser()
  return Promise.reject(errorResponse)
}

export { logoutUserResponseInterceptor }
