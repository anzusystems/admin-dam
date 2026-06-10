import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { VoiceDiscriminator, type VoiceDiscriminatorType } from '@/types/coreDam/Voice'

export function useVoiceDiscriminator() {
  const { t } = useI18n()

  const valueObjectOptions = ref<ValueObjectOption<VoiceDiscriminatorType>[]>([
    { value: VoiceDiscriminator.Elevenlabs, title: t('coreDam.voice.discriminator.elevenlabs') },
    { value: VoiceDiscriminator.GoogleTts, title: t('coreDam.voice.discriminator.google_tts') },
  ])

  const valueObjectOptionsNullable = computed<ValueObjectOption<VoiceDiscriminatorType | null>[]>(() => [
    { value: null, title: t('coreDam.voice.discriminator.none') },
    ...valueObjectOptions.value,
  ])

  const getVoiceDiscriminatorOption = (value: VoiceDiscriminatorType) => {
    return valueObjectOptions.value.find((item) => item.value === value)
  }

  return {
    valueObjectOptions,
    valueObjectOptionsNullable,
    getVoiceDiscriminatorOption,
  }
}
