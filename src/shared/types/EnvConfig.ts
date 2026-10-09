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
    /** On for `true`, or for the text `true` in whatever case and with spaces around it; only with a non-empty address. */
    enabled: boolean | string
    webSocketUrl: string
  }
  sentry: {
    dsn: string
  }
}

/** `config.json` as a deployment has it: one without the notification service may leave its block, or a field of it, out. */
export type DeployedEnvConfig = Omit<EnvConfig, 'notification'> & {
  notification?: Partial<EnvConfig['notification']>
}
