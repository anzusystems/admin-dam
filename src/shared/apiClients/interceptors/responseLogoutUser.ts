import type { AxiosError } from 'axios'
import { logoutUser } from '@/domains/system/composables/currentUser'

const logoutUserResponseInterceptor = (errorResponse: AxiosError) => {
  if (errorResponse.response?.status === HTTP_STATUS_UNAUTHORIZED) logoutUser()
  return Promise.reject(errorResponse)
}

export { logoutUserResponseInterceptor }
