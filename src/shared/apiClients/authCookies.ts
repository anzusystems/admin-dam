import Cookies from 'universal-cookie'

import { envConfig } from '@/shared/EnvConfigService'

/*
 * Bare `universal-cookie`, not VueUse's `useCookies()`. Both readers run outside a Vue effect scope.
 * There `useCookies()` leaks an instance and a permanent change
 * listener per call, and its `tryOnScopeDispose` cleanup does nothing.
 */
const cookies = new Cookies()

export const getAuthCookieState = () => ({
  refreshTokenExists: cookies.get<string | undefined>(envConfig.cookies.refreshTokenExistsName),
  jwtPayload: cookies.get<string | undefined>(envConfig.cookies.jwtPayloadName),
})
