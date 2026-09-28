import { modifyLanguageSettings } from '@anzusystems/common-admin'
import { describe, expect, it } from 'vitest'

import { initLanguageMessagesLoaded, initLoadLanguageMessages } from '@/loadLanguageMessages'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, i18n } from '@/plugins/i18n'

// `xx` is for administrators: every text shows its translation key, so they can tell which one to change. It
// loads no messages. Left unmarked, the guard ran the loader again on every navigation.
describe('language messages in the translation-id mode', () => {
  it('count as loaded, and the texts still show their keys', async () => {
    modifyLanguageSettings(AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, i18n).setLanguage('xx')
    await initLoadLanguageMessages()

    expect(initLanguageMessagesLoaded.value).toBe(true)
    expect(i18n.global.locale.value).toBe('xx')
    expect(i18n.global.t('common.button.save')).toBe('common.button.save')
  })
})
