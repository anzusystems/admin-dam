import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { TtsRequestMode } from '@/types/coreDam/TtsNarrationRequest'

export function useTtsRequestMode() {
  const { t } = useI18n()

  const ttsRequestModeOptions = ref<ValueObjectOption<TtsRequestMode>[]>([
    { value: TtsRequestMode.Initial, title: t('coreDam.ttsNarrationRequest.mode.initial'), color: 'info' },
    { value: TtsRequestMode.Regenerate, title: t('coreDam.ttsNarrationRequest.mode.regenerate'), color: 'secondary' },
  ])

  const getTtsRequestModeOption = (value: TtsRequestMode) => {
    return ttsRequestModeOptions.value.find((item) => item.value === value)
  }

  return {
    ttsRequestModeOptions,
    getTtsRequestModeOption,
  }
}
