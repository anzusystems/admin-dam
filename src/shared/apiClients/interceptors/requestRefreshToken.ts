import type { InternalAxiosRequestConfig } from 'axios'

import { useRefreshToken } from '@/domains/system/auth/authApi'
import { logoutUser } from '@/domains/system/composables/currentUser'
import { getAuthCookieState } from '@/shared/apiClients/authCookies'

type AcceptRequestConfigCallbackType = (accept: boolean) => void

let isRefreshingToken = false
let userRefreshSubscribers: Array<AcceptRequestConfigCallbackType> = []

// Detached before the callbacks run: `filter` worked only because they return undefined.
const onRefreshedUser = (accept = true) => {
  const subscribers = userRefreshSubscribers
  userRefreshSubscribers = []
  subscribers.forEach((callback) => callback(accept))
}

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
      const { execute: refreshToken } = useRefreshToken()
      /* Before the flush, not after: a request made from a released caller's own continuation
       * would find the flag up and join a queue nobody is going to flush again. */
      refreshToken({ body: {} })
        .then(() => {
          isRefreshingToken = false
          onRefreshedUser()
        })
        .catch(() => {
          isRefreshingToken = false
          onRefreshedUser(false)
          logoutUser()
        })
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
