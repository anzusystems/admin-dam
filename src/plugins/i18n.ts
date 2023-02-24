import { commonMessages, i18n } from '@anzusystems/common-admin'
import en from '@/locales/en.json'
import sk from '@/locales/sk.json'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createI18n } from 'vue-i18n'

const finalEn = { ...commonMessages.en, ...en }
const finalSk = { ...commonMessages.sk, ...sk }

export type MessageSchema = typeof finalEn

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
