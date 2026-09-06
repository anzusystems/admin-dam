import type { AxiosInstance } from 'axios'
import axios, { type AxiosRequestConfig } from 'axios'
import { envConfig } from '@/shared/EnvConfigService'
import { SYSTEM_ADMIN_DAM } from '@/shared/systems'
import { userRefreshRequestInterceptor } from '@/shared/apiClients/interceptors/requestRefreshToken'
import { logoutUserResponseInterceptor } from '@/shared/apiClients/interceptors/responseLogoutUser'
import { AUTH_PATH_PREFIX } from '@/domains/system/auth/authApi'
import { PUB_END_POINT_PREFIX } from '@/shared/configurationApi'

let mainInstance: AxiosInstance | null = null

/* Interceptors inside the guard: this factory runs on every request, so registering outside grew
 * `interceptors.*.handlers` without bound. */
const damClient = function (): AxiosInstance {
  if (isNull(mainInstance)) {
    mainInstance = axios.create({
      baseURL: envConfig.dam.apiUrl,
      timeout: envConfig.dam.apiTimeout * 1000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Version': SYSTEM_ADMIN_DAM + '-' + envConfig.appVersion,
      },
    })

    // Off the two prefixes that must not recurse into it: `/auth`, which performs the refresh
    // itself, and `/pub`, which is unauthenticated configuration.
    mainInstance.interceptors.request.use(userRefreshRequestInterceptor, undefined, {
      runWhen: (requestConfig: AxiosRequestConfig): boolean => {
        return !requestConfig.url?.startsWith(AUTH_PATH_PREFIX) && !requestConfig.url?.startsWith(PUB_END_POINT_PREFIX)
      },
    })
    mainInstance.interceptors.response.use((response) => response, logoutUserResponseInterceptor)
  }

  return mainInstance
}

export { damClient }
