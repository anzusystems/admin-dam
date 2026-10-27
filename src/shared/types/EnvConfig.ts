export interface EnvConfig {
  adminSwitcherConfigUrl: string
  appEnvironment: string
  appVersion: string
  appLabel: string
  logoutCoreDamUrl: string
  /** @deprecated The poll of the upload queue always runs; the value is not read. */
  uploadStatusFallback?: boolean
  cookies: {
    refreshTokenExistsName: string
    jwtPayloadName: string
  }
  dam: {
    apiUrl: string
    apiTimeout: number
    adminUrl: string
    authorCleanPhraseTestSample: string
  }
  notification: {
    /** On for `true` or the string `true` in any case, trimmed. Only with a non-empty address. */
    enabled: boolean | string
    webSocketUrl: string
  }
  sentry: {
    dsn: string
  }
}

/**
 * `config.json` as deployed. A deployment without the notification service may omit its block or some of its fields.
 */
export type DeployedEnvConfig = Omit<EnvConfig, 'notification'> & {
  notification?: Partial<EnvConfig['notification']>
}
