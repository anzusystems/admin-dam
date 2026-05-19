import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { TtsAudioStatus } from '@/types/coreDam/TtsNarrationRequest'

export const ttsAudioStatusColors: Record<TtsAudioStatus, string | undefined> = {
  [TtsAudioStatus.Active]: 'success',
  [TtsAudioStatus.Superseding]: 'warning',
  [TtsAudioStatus.Cancelling]: 'warning',
  [TtsAudioStatus.Failed]: 'error',
  [TtsAudioStatus.Unpublished]: 'grey',
}

export function useTtsAudioStatus() {
  const { t } = useI18n()

  const ttsAudioStatusOptions = ref<ValueObjectOption<TtsAudioStatus>[]>([
    { value: TtsAudioStatus.Active, title: t('coreDam.ttsNarrationRequest.assetStatus.active') },
    { value: TtsAudioStatus.Superseding, title: t('coreDam.ttsNarrationRequest.assetStatus.superseding') },
    { value: TtsAudioStatus.Cancelling, title: t('coreDam.ttsNarrationRequest.assetStatus.cancelling') },
    { value: TtsAudioStatus.Failed, title: t('coreDam.ttsNarrationRequest.assetStatus.failed') },
    { value: TtsAudioStatus.Unpublished, title: t('coreDam.ttsNarrationRequest.assetStatus.unpublished') },
  ])

  const getTtsAudioStatusOption = (value: TtsAudioStatus) => {
    return ttsAudioStatusOptions.value.find((item) => item.value === value)
  }

  return {
    ttsAudioStatusOptions,
    getTtsAudioStatusOption,
  }
}
