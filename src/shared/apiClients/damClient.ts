import { defineApiClient, skipUrlPrefixes } from '@anzusystems/common-admin'

import { AUTH_PATH_PREFIX } from '@/domains/system/auth/authApi'
import { PUB_END_POINT_PREFIX } from '@/shared/apiClients/configurationApi'
import { userRefreshRequestInterceptor } from '@/shared/apiClients/interceptors/requestRefreshToken'
import { logoutUserResponseInterceptor } from '@/shared/apiClients/interceptors/responseLogoutUser'
import { envConfig } from '@/shared/EnvConfigService'
import { SYSTEM_ADMIN_DAM } from '@/shared/systems'

const damClient = defineApiClient(() => ({
  config: {
    baseURL: envConfig.dam.apiUrl,
    timeout: envConfig.dam.apiTimeout * 1000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'X-App-Version': SYSTEM_ADMIN_DAM + '-' + envConfig.appVersion,
    },
  },
  request: [
    {
      onFulfilled: userRefreshRequestInterceptor,
      // Skipped for prefixes that must not recurse: `/auth` performs
      // the refresh itself, and `/pub` is unauthenticated config.
      options: { runWhen: skipUrlPrefixes(AUTH_PATH_PREFIX, PUB_END_POINT_PREFIX) },
    },
  ],
  response: [{ onRejected: logoutUserResponseInterceptor }],
}))

export { damClient }
