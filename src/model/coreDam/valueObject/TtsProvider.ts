import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { TtsProvider } from '@/types/coreDam/TtsProvider'
import type { TtsProvider as TtsProviderType } from '@/types/coreDam/TtsProvider'

export function useTtsProvider() {
  const { t } = useI18n()

  const ttsProviderOptions = computed<ValueObjectOption<TtsProviderType>[]>(() => [
    { value: TtsProvider.Elevenlabs, title: t('coreDam.voiceFamily.ttsProvider.elevenlabs') },
    { value: TtsProvider.GoogleTts, title: t('coreDam.voiceFamily.ttsProvider.googleTts') },
  ])

  const ttsProviderOptionsNullable = computed<ValueObjectOption<TtsProviderType | null>[]>(() => [
    { value: null, title: t('coreDam.voiceFamily.ttsProvider.none') },
    ...ttsProviderOptions.value,
  ])

  return {
    ttsProviderOptions,
    ttsProviderOptionsNullable,
  }
}
