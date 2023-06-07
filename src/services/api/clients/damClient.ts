import type { AxiosInstance } from 'axios'
import axios, { type AxiosRequestConfig } from 'axios'
import { envConfig } from '@/services/EnvConfigService'
import { isNull } from '@anzusystems/common-admin'
import { SYSTEM_ADMIN_DAM } from '@/model/systems'
import { userRefreshRequestInterceptor } from '@/services/api/clients/interceptors/requestRefreshToken'
import { logoutUserResponseInterceptor } from '@/services/api/clients/interceptors/responseLogoutUser'
import { AUTH_PATH_PREFIX } from '@/services/api/coreDam/authApi'
import { PUB_END_POINT_PREFIX } from '@/services/api/coreDam/configurationApi'

let mainInstance: AxiosInstance | null = null

const damClient = function (
  timeoutBase = envConfig.dam.apiTimeout,
  onUploadProgressCallback: ((progressEvent: any) => void) | undefined = undefined
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
