import { type LanguageCode, modifyLanguageSettings } from '@anzusystems/common-admin'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '@/main'
import { ref } from 'vue'

export const initLanguageMessagesLoaded = ref(false)

export const initLoadLanguageMessages = async () => {
  const loadMessages = async (code: LanguageCode | 'default') => {
    if (code === 'default' || code === 'xx') return true
    try {
      const messages = await import(`./locales/${code}.ts`)
      addMessages(code, messages.default)
      initLanguageMessagesLoaded.value = true
      return true
    } catch (e) {
      console.error('Unable to load language translation messages.', e)
      return false
    }
  }
  const { initializeLanguage, addMessages, currentLanguageCode } = modifyLanguageSettings(
    AVAILABLE_LANGUAGES,
    DEFAULT_LANGUAGE
  )
  initializeLanguage()
  await loadMessages(currentLanguageCode.value)
}
