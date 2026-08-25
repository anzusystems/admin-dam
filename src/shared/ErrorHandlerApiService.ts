import type { App } from 'vue'
import { envConfig } from '@/shared/EnvConfigService'
import { LogLevel } from '@anzusystems/common-admin'
import { SYSTEM_ADMIN_DAM } from '@/shared/systems'
import { damClient } from '@/shared/apiClients/damClient'

export const createLog = (
  message = '',
  content = '',
  level = LogLevel.Error,
  path: null | string = null,
  system = SYSTEM_ADMIN_DAM
) => {
  if (isNull(path)) path = window && window.location && window.location.href ? window.location.href : ''
  if (message.length === 0 && path.length === 0 && content.length === 0) return
  const data = {
    level: level,
    message: message,
    appSystem: system,
    content: content,
    path: path,
    // contextId: 'contextId', todo: check if we can connect some errors by contextId
  }
  console.error(data)

  damClient().post(envConfig.apiLogError.apiUrl, JSON.stringify(data))
}

export const initErrorHandler = (app: App<Element>) => {
  if (envConfig.apiLogError.enabled && envConfig.apiLogError.apiUrl.length > 0) {
    app.config.errorHandler = (err: Error | unknown, instance: ComponentPublicInstance | null, info: string) => {
      try {
        // @ts-ignore
        const message = err.message ? err.message : ''
        // @ts-ignore
        createLog(info && info.length > 0 ? `[${info}] ${message}` : message, err.stack ? err.stack : '')
        console.error(err)
      } catch (e) {
        console.error(e)
      }
    }
  }
}
