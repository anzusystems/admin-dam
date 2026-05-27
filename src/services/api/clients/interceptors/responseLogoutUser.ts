import type { AxiosError } from 'axios'
import { logoutUser } from '@/composables/system/currentUser'

const logoutUserResponseInterceptor = (errorResponse: AxiosError) => {
  if (errorResponse.response?.status === HTTP_STATUS_UNAUTHORIZED) logoutUser()
  return Promise.reject(errorResponse)
}

export { logoutUserResponseInterceptor }
