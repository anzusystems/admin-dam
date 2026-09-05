import type { InternalAxiosRequestConfig } from 'axios'
import { useRefreshToken } from '@/domains/system/auth/authApi'
import { getAuthCookieState } from '@/shared/apiClients/authCookies'
import { logoutUser } from '@/domains/system/composables/currentUser'

type AcceptRequestConfigCallbackType = (accept: boolean) => void

let isRefreshingToken = false
let userRefreshSubscribers: Array<AcceptRequestConfigCallbackType> = []

const onRefreshedUser = (accept = true) =>
  (userRefreshSubscribers = userRefreshSubscribers.filter((callback) => callback(accept)))

const addRefreshUserSubscriber = (callback: AcceptRequestConfigCallbackType) => userRefreshSubscribers.push(callback)

const userRefreshRequestInterceptor = (
  requestConfig: Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig => {
  const { refreshTokenExists, jwtPayload } = getAuthCookieState()

  if (!refreshTokenExists && !jwtPayload) {
    logoutUser()

    return Promise.reject(requestConfig)
  }

  if (refreshTokenExists && !jwtPayload) {
    if (!isRefreshingToken) {
      isRefreshingToken = true
      const { executeRequest: refreshToken } = useRefreshToken()
      refreshToken({ object: {} })
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
