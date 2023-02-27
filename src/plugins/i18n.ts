import { i18n } from '@anzusystems/common-admin'
import { en } from '@/locales/en'
import { sk } from '@/locales/sk'

export type MessageSchema = typeof en

export function addI18nMessages() {
  i18n.global.setLocaleMessage('en', en)
  // @ts-ignore
  i18n.global.setLocaleMessage('sk', sk)
}

export { i18n }
