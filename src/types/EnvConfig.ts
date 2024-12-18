export interface EnvConfig {
  adminSwitcherConfigUrl: string
  appEnvironment: string
  appVersion: string
  apiLogError: {
    enabled: boolean
    apiUrl: string
  }
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
    authorCleanPhraseTestSample: string
  }
  notification: {
    enabled: boolean
    webSocketUrl: string
  }
}
