import type { AxiosInstance, AxiosProgressEvent } from 'axios'
import axios, { type AxiosRequestConfig } from 'axios'
import { envConfig } from '@/shared/EnvConfigService'
import { SYSTEM_ADMIN_DAM } from '@/shared/systems'
import { userRefreshRequestInterceptor } from '@/shared/apiClients/interceptors/requestRefreshToken'
import { logoutUserResponseInterceptor } from '@/shared/apiClients/interceptors/responseLogoutUser'
import { AUTH_PATH_PREFIX } from '@/domains/system/auth/authApi'
import { PUB_END_POINT_PREFIX } from '@/shared/configurationApi'

let mainInstance: AxiosInstance | null = null

const damClient = function (
  timeoutBase = envConfig.dam.apiTimeout,
  onUploadProgressCallback: ((progressEvent: AxiosProgressEvent) => void) | undefined = undefined
): AxiosInstance {
  if (isNull(mainInstance)) {
    mainInstance = axios.create({
      baseURL: envConfig.dam.apiUrl,
      timeout: timeoutBase * 1000,
      // timeout: 10 * 1000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': SYSTEM_ADMIN_DAM + '-' + envConfig.appVersion,
      },
      onUploadProgress: onUploadProgressCallback,
    })
  }

  // refresh token interceptor should run on all request except current user api which performs token refresh action
  mainInstance.interceptors.request.use(userRefreshRequestInterceptor, undefined, {
    runWhen: (requestConfig: AxiosRequestConfig): boolean => {
      return !requestConfig.url?.startsWith(AUTH_PATH_PREFIX) && !requestConfig.url?.startsWith(PUB_END_POINT_PREFIX)
    },
  })
  mainInstance.interceptors.response.use((response) => response, logoutUserResponseInterceptor)

  return mainInstance
}

export { damClient }
