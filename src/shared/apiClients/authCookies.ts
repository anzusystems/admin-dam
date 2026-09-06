import Cookies from 'universal-cookie'
import { envConfig } from '@/shared/EnvConfigService'

/* Bare `universal-cookie`, not VueUse's `useCookies()`: both readers run outside a Vue effect scope, where it leaks
 * an instance plus a permanent change listener per call and its `tryOnScopeDispose` cleanup is a silent no-op. */
const cookies = new Cookies()

export const getAuthCookieState = () => ({
  refreshTokenExists: cookies.get<string | undefined>(envConfig.cookies.refreshTokenExistsName),
  jwtPayload: cookies.get<string | undefined>(envConfig.cookies.jwtPayloadName),
})
