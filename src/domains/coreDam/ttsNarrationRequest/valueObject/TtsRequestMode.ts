import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import {
  TtsRequestMode,
  type TtsRequestModeType,
} from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'

export function useTtsRequestMode() {
  const { t } = useI18n()

  const ttsRequestModeOptions = ref<ValueObjectOption<TtsRequestModeType>[]>([
    { value: TtsRequestMode.Initial, title: t('coreDam.ttsNarrationRequest.mode.initial'), color: 'info' },
    { value: TtsRequestMode.Regenerate, title: t('coreDam.ttsNarrationRequest.mode.regenerate'), color: 'secondary' },
  ])

  const getTtsRequestModeOption = (value: TtsRequestModeType) => {
    return ttsRequestModeOptions.value.find((item) => item.value === value)
  }

  return {
    ttsRequestModeOptions,
    getTtsRequestModeOption,
  }
}
