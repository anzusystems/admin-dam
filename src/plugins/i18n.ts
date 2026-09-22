import { createI18n } from 'vue-i18n'
import type { Locale, Path } from 'vue-i18n'
import { slovakPluralizationRule } from '@anzusystems/common-admin'
import type sk from '@/locales/sk'

export type MessageSchema = typeof sk

import { type LanguageCode } from '@anzusystems/common-admin'

export const DEFAULT_LANGUAGE: LanguageCode = 'sk'
export const AVAILABLE_LANGUAGES: Array<LanguageCode> = ['sk', 'en']

const REQUIRED_LOCALES = ['sk']

export const i18n = createI18n<[MessageSchema]>({
  globalInjection: false,
  legacy: false,
  locale: 'sk',
  fallbackLocale: false,
  pluralRules: {
    sk: slovakPluralizationRule,
  },
  missing: (locale: Locale, key: Path) => {
    if (REQUIRED_LOCALES.includes(locale)) {
      console.warn(`Missing ${locale} translation: ${key}`)
    }
  },
})
