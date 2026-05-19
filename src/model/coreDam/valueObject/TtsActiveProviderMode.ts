import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { TtsActiveProviderMode } from '@/types/coreDam/TtsActiveProviderMode'
import type { TtsActiveProviderMode as TtsActiveProviderModeType } from '@/types/coreDam/TtsActiveProviderMode'

export function useTtsActiveProviderMode() {
  const { t } = useI18n()

  const valueObjectOptions = ref<ValueObjectOption<TtsActiveProviderModeType>[]>([
    { value: TtsActiveProviderMode.Elevenlabs, title: t('coreDam.extSystem.ttsSettings.modes.elevenlabs') },
    { value: TtsActiveProviderMode.GoogleTts, title: t('coreDam.extSystem.ttsSettings.modes.google_tts') },
    { value: TtsActiveProviderMode.Auto, title: t('coreDam.extSystem.ttsSettings.modes.auto') },
  ])

  const getTtsActiveProviderModeOption = (value: TtsActiveProviderModeType) => {
    return valueObjectOptions.value.find((item) => item.value === value)
  }

  return {
    valueObjectOptions,
    getTtsActiveProviderModeOption,
  }
}
