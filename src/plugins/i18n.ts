import type { Locale, Path } from 'vue-i18n'
import { createI18n } from 'vue-i18n'
import { createLog } from '@/services/ErrorHandlerApiService'
import { LogLevel } from '@/model/common/valueObject/LogLevel'
import { messages } from '@/locales'
import { envConfig } from '@/services/EnvConfigService'

const DO_NOT_LOG_LOCALES = ['en']

export const i18n = createI18n({
  globalInjection: false,
  legacy: false,
  useScope: 'global',
  locale: 'en', // will be changed in App.vue
  fallbackLocale: false,
  missing: (locale: Locale, key: Path) => {
    if (DO_NOT_LOG_LOCALES.includes(locale)) return
    console.warn(`Missing ${locale} translation: ${key}`)
    if (!envConfig.apiLogError.enabled || envConfig.apiLogError.apiUrl.length === 0) return
    createLog(`Missing ${locale} translation`, key, LogLevel.Warning)
  },
  fallbackWarn: false,
  messages,
})
