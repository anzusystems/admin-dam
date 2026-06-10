import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { Language, type LanguageType } from '@/types/coreDam/VoiceFamily'

export function useLanguage() {
  const { t } = useI18n()

  const valueObjectOptions = ref<ValueObjectOption<LanguageType>[]>([
    { value: Language.Slovak, title: t('coreDam.voiceFamily.language.sk') },
    { value: Language.English, title: t('coreDam.voiceFamily.language.en') },
  ])

  return {
    valueObjectOptions,
  }
}
