import { useStorage } from '@vueuse/core'
import { readonly } from 'vue'
import { i18n } from '@/plugins/i18n'
import { isNull } from '@/utils/common'

export type LocaleCode = 'sk' | 'cz' | 'en' | 'xx'

export interface Locale {
  code: LocaleCode
  title: string
}

let i18nGlobal = null as null | any

const allLocales = [
  {
    code: 'sk',
    title: 'Slovensky',
  },
  {
    code: 'en',
    title: 'English',
  },
  // {
  //   code: 'cz',
  //   title: 'Česky',
  // },
  // {
  //   code: 'xx',
  //   title: 'Translation ID',
  // },
] as Locale[]

export const DEFAULT_LANGUAGE = 'en'
export const defaultLocale = allLocales[0]

const storedSettings = useStorage('language', DEFAULT_LANGUAGE)

const setLocale = (code: LocaleCode) => {
  if (isNull(i18nGlobal)) return
  if (i18nGlobal.availableLocales.includes(code)) {
    i18nGlobal.locale.value = code
    storedSettings.value = code
  }
}

export function useLocaleSettings() {
  const initializeLocale = () => {
    i18nGlobal = i18n.global || i18n
    if (i18nGlobal.availableLocales.includes(storedSettings.value)) {
      i18nGlobal.locale.value = storedSettings.value
    }
  }

  return {
    initializeLocale,
    currentLocaleCode: readonly(storedSettings),
    setLocale,
    allLocales,
  }
}
