import type { AxiosError } from 'axios'
import { HTTP_STATUS_UNAUTHORIZED } from '@anzusystems/common-admin'
import { logoutUser } from '@/composables/system/currentUser'

const logoutUserResponseInterceptor = (errorResponse: AxiosError) => {
  if (errorResponse.response?.status === HTTP_STATUS_UNAUTHORIZED) logoutUser()
  return Promise.reject(errorResponse)
}

export { logoutUserResponseInterceptor }
