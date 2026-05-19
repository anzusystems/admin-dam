import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { GoogleSsmlGender, type GoogleSsmlGenderType } from '@/types/coreDam/Voice'

export function useGoogleSsmlGender() {
  const { t } = useI18n()

  const valueObjectOptions = ref<ValueObjectOption<GoogleSsmlGenderType>[]>([
    { value: GoogleSsmlGender.Male, title: t('coreDam.voice.ssmlGender.MALE') },
    { value: GoogleSsmlGender.Female, title: t('coreDam.voice.ssmlGender.FEMALE') },
    { value: GoogleSsmlGender.Neutral, title: t('coreDam.voice.ssmlGender.NEUTRAL') },
  ])

  const getGoogleSsmlGenderOption = (value: GoogleSsmlGenderType) => {
    return valueObjectOptions.value.find((item) => item.value === value)
  }

  return {
    valueObjectOptions,
    getGoogleSsmlGenderOption,
  }
}
