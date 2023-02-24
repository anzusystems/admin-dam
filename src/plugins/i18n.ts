import { commonMessages, i18n } from '@anzusystems/common-admin'

import en from '@/locales/en.json'
import sk from '@/locales/sk.json'

const finalEn = { ...commonMessages.en, ...en }
const finalSk = { ...commonMessages.sk, ...sk }

export type MessageSchema = typeof finalSk

const finalMessages = {
  sk: finalSk,
  en: finalEn,
  xx: { ...commonMessages.xx },
}

export function addI18nMessages() {
  i18n.global.setLocaleMessage('en', finalEn)
  i18n.global.setLocaleMessage('sk', finalSk)
}

export { i18n }
