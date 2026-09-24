import { i18n as commonAdminI18n, modifyLanguageSettings } from '@anzusystems/common-admin'
import type { LanguageCode } from '@anzusystems/common-admin'
import { ref } from 'vue'

import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, i18n } from '@/plugins/i18n'

export const initLanguageMessagesLoaded = ref(false)

const { initializeLanguage, addMessages, currentLanguageCode } = modifyLanguageSettings(
  AVAILABLE_LANGUAGES,
  DEFAULT_LANGUAGE,
  i18n
)

export const initLoadLanguageMessages = async () => {
  const loadMessages = async (code: LanguageCode | 'default') => {
    if (code === 'default' || code === 'xx') return true
    try {
      const messages = await import(`./locales/${code}.ts`)
      addMessages(code, messages.default)
      commonAdminI18n.global.setLocaleMessage(code, messages.default)
      commonAdminI18n.global.locale.value = code
      initLanguageMessagesLoaded.value = true
      return true
    } catch (e) {
      console.error('Unable to load language translation messages.', e)
      return false
    }
  }
  initializeLanguage()
  await loadMessages(currentLanguageCode.value)
}
