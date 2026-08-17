import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { GoogleSsmlGender, type GoogleSsmlGenderType } from '@/domains/coreDam/voiceFamily/types/Voice'

export function useGoogleSsmlGender() {
  const { t } = useI18n()

  const valueObjectOptions = ref<ValueObjectOption<GoogleSsmlGenderType>[]>([
    { value: GoogleSsmlGender.Male, title: t('coreDam.voice.ssmlGender.MALE') },
    { value: GoogleSsmlGender.Female, title: t('coreDam.voice.ssmlGender.FEMALE') },
    { value: GoogleSsmlGender.Neutral, title: t('coreDam.voice.ssmlGender.NEUTRAL') },
  ])

  return {
    valueObjectOptions,
  }
}
