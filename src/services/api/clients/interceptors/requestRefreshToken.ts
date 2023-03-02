import type { InternalAxiosRequestConfig } from 'axios'
import { refreshToken } from '@/services/api/coreDam/authApi'
import { useCookies } from '@vueuse/integrations/useCookies'
import { logoutUser } from '@/composables/system/currentUser'
import { envConfig } from '@/services/EnvConfigService'

type AcceptRequestConfigCallbackType = (accept: boolean) => void

let isRefreshingToken = false
let userRefreshSubscribers: Array<AcceptRequestConfigCallbackType> = []

const onRefreshedUser = (accept = true) =>
  (userRefreshSubscribers = userRefreshSubscribers.filter((callback) => callback(accept)))

const addRefreshUserSubscriber = (callback: AcceptRequestConfigCallbackType) => userRefreshSubscribers.push(callback)

const userRefreshRequestInterceptor = (
  requestConfig: Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig => {
  const cookies = useCookies([envConfig.cookies.refreshTokenExistsName, envConfig.cookies.jwtPayloadName])

  if (!cookies.get(envConfig.cookies.refreshTokenExistsName) && !cookies.get(envConfig.cookies.jwtPayloadName)) {
    logoutUser()

    return Promise.reject(requestConfig)
  }

  if (cookies.get(envConfig.cookies.refreshTokenExistsName) && !cookies.get(envConfig.cookies.jwtPayloadName)) {
    if (!isRefreshingToken) {
      isRefreshingToken = true
      refreshToken()
        .then(() => onRefreshedUser())
        .catch(() => {
          onRefreshedUser(false)
          logoutUser()
        })
        .finally(() => (isRefreshingToken = false))
    }

    return new Promise((resolve, reject) =>
      addRefreshUserSubscriber((accept): void => {
        if (accept) resolve(requestConfig)
        else reject(requestConfig)
      })
    )
  }

  return requestConfig
}

export { userRefreshRequestInterceptor }
