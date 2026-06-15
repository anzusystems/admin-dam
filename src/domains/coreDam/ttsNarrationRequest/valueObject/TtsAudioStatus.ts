import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { TtsAudioStatus, type TtsAudioStatusType } from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'

export function useTtsAudioStatus() {
  const { t } = useI18n()

  const ttsAudioStatusOptions = ref<ValueObjectOption<TtsAudioStatusType>[]>([
    { value: TtsAudioStatus.Active, title: t('coreDam.ttsNarrationRequest.assetStatus.active'), color: 'success' },
    {
      value: TtsAudioStatus.Superseding,
      title: t('coreDam.ttsNarrationRequest.assetStatus.superseding'),
      color: 'warning',
    },
    {
      value: TtsAudioStatus.Cancelling,
      title: t('coreDam.ttsNarrationRequest.assetStatus.cancelling'),
      color: 'warning',
    },
    { value: TtsAudioStatus.Failed, title: t('coreDam.ttsNarrationRequest.assetStatus.failed'), color: 'error' },
    {
      value: TtsAudioStatus.Unpublished,
      title: t('coreDam.ttsNarrationRequest.assetStatus.unpublished'),
      color: 'grey',
    },
  ])

  const getTtsAudioStatusOption = (value: TtsAudioStatusType) => {
    return ttsAudioStatusOptions.value.find((item) => item.value === value)
  }

  return {
    ttsAudioStatusOptions,
    getTtsAudioStatusOption,
  }
}
