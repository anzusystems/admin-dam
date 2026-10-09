import { startWithEnvConfig } from '@anzusystems/common-admin'

import type { DeployedEnvConfig, EnvConfig } from '@/shared/types/EnvConfig'

export const envConfig: EnvConfig = {
  adminSwitcherConfigUrl: '',
  appEnvironment: '',
  appVersion: '',
  appLabel: '',
  logoutCoreDamUrl: '',
  cookies: {
    refreshTokenExistsName: 'anz_rte',
    jwtPayloadName: 'anz_jp',
  },
  dam: {
    apiUrl: '',
    apiTimeout: 1,
    adminUrl: '',
    authorCleanPhraseTestSample: '',
  },
  notification: {
    enabled: true,
    webSocketUrl: '',
  },
  sentry: {
    dsn: '',
  },
}

const setEnvConfig = (data: DeployedEnvConfig) => {
  try {
    envConfig.adminSwitcherConfigUrl = data.adminSwitcherConfigUrl
    envConfig.appEnvironment = data.appEnvironment
    envConfig.appVersion = data.appVersion
    envConfig.appLabel = data.appLabel ?? ''
    envConfig.logoutCoreDamUrl = data.logoutCoreDamUrl
    envConfig.cookies.refreshTokenExistsName = data.cookies.refreshTokenExistsName
    envConfig.cookies.jwtPayloadName = data.cookies.jwtPayloadName
    envConfig.dam.apiUrl = data.dam.apiUrl
    envConfig.dam.apiTimeout = data.dam.apiTimeout
    envConfig.dam.adminUrl = data.dam.adminUrl
    envConfig.dam.authorCleanPhraseTestSample = data.dam.authorCleanPhraseTestSample
    // The service is used only where a deployment asks for it: no block, or no value, is the service off.
    envConfig.notification.enabled = data.notification?.enabled ?? false
    envConfig.notification.webSocketUrl = data.notification?.webSocketUrl ?? ''
    envConfig.sentry.dsn = data.sentry.dsn
  } catch (err) {
    throw new Error('Unable to load env config. Incorrect fields in json.')
  }
}

// The fetch, its checks and the fatal error live in the library: a failed start is reported as
// itself, not as a config that did not load.
export const loadEnvConfig = (callback: () => void | Promise<void>) => startWithEnvConfig(setEnvConfig, callback)
