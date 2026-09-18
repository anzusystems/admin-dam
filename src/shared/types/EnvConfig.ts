export interface EnvConfig {
  adminSwitcherConfigUrl: string
  appEnvironment: string
  appVersion: string
  logoutCoreDamUrl: string
  uploadStatusFallback: boolean
  cookies: {
    refreshTokenExistsName: string
    jwtPayloadName: string
  }
  dam: {
    apiUrl: string
    apiTimeout: number
    imageUrl: string
    adminUrl: string
    authorCleanPhraseTestSample: string
  }
  notification: {
    enabled: boolean
    webSocketUrl: string
  }
  sentry: {
    dsn: string
  }
}
