import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { TtsRequestStatus, type TtsRequestStatusType } from '@/types/coreDam/TtsNarrationRequest'

export function useTtsRequestStatus() {
  const { t } = useI18n()

  const ttsRequestStatusOptions = ref<ValueObjectOption<TtsRequestStatusType>[]>([
    { value: TtsRequestStatus.Waiting, title: t('coreDam.ttsNarrationRequest.status.waiting'), color: 'warning' },
    { value: TtsRequestStatus.Processing, title: t('coreDam.ttsNarrationRequest.status.processing'), color: 'info' },
    { value: TtsRequestStatus.Done, title: t('coreDam.ttsNarrationRequest.status.done'), color: 'success' },
    { value: TtsRequestStatus.Failed, title: t('coreDam.ttsNarrationRequest.status.failed'), color: 'error' },
    { value: TtsRequestStatus.Cancelled, title: t('coreDam.ttsNarrationRequest.status.cancelled'), color: 'grey' },
  ])

  const getTtsRequestStatusOption = (value: TtsRequestStatusType) => {
    return ttsRequestStatusOptions.value.find((item) => item.value === value)
  }

  return {
    ttsRequestStatusOptions,
    getTtsRequestStatusOption,
  }
}
