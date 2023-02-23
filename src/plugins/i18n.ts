import type { Locale, Path } from 'vue-i18n'
import { createI18n, useI18n as vueUseI18n } from 'vue-i18n'
import { createLog } from '@/services/ErrorHandlerApiService'
import { LogLevel } from '@/model/common/valueObject/LogLevel'
import { envConfig } from '@/services/EnvConfigService'
import { commonMessages } from '@anzusystems/common-admin'

const DO_NOT_LOG_LOCALES = ['en']

import en from '@/locales/en.json'
import sk from '@/locales/sk.json'

const finalEn = { ...commonMessages.en, ...en }
const finalSK = { ...commonMessages.sk, ...sk }

export type MessageSchema = typeof finalEn

const finalMessages = {
  sk: finalSK,
  en: finalEn,
  xx: { ...commonMessages.xx },
}

// export const i18n = createI18n<[MessageSchema], 'en' | 'sk'>({
export const i18n = createI18n<[MessageSchema], 'en'>({
  globalInjection: false,
  legacy: false,
  locale: 'en',
  fallbackLocale: false,
  missing: (locale: Locale, key: Path) => {
    if (DO_NOT_LOG_LOCALES.includes(locale)) return
    console.warn(`Missing ${locale} translation: ${key}`)
    if (!envConfig.apiLogError.enabled || envConfig.apiLogError.apiUrl.length === 0) return
    createLog(`Missing ${locale} translation`, key, LogLevel.Warning)
  },
  fallbackWarn: false,
  messages: finalMessages,
})
