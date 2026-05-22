import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { TtsRequestStatus } from '@/types/coreDam/TtsNarrationRequest'

export const ttsRequestStatusColors: Record<TtsRequestStatus, string | undefined> = {
  [TtsRequestStatus.Waiting]: 'warning',
  [TtsRequestStatus.Processing]: 'info',
  [TtsRequestStatus.Assembling]: 'info',
  [TtsRequestStatus.Done]: 'success',
  [TtsRequestStatus.Failed]: 'error',
  [TtsRequestStatus.Cancelled]: 'grey',
}

export function useTtsRequestStatus() {
  const { t } = useI18n()

  const ttsRequestStatusOptions = ref<ValueObjectOption<TtsRequestStatus>[]>([
    { value: TtsRequestStatus.Waiting, title: t('coreDam.ttsNarrationRequest.status.waiting') },
    { value: TtsRequestStatus.Processing, title: t('coreDam.ttsNarrationRequest.status.processing') },
    { value: TtsRequestStatus.Assembling, title: t('coreDam.ttsNarrationRequest.status.assembling') },
    { value: TtsRequestStatus.Done, title: t('coreDam.ttsNarrationRequest.status.done') },
    { value: TtsRequestStatus.Failed, title: t('coreDam.ttsNarrationRequest.status.failed') },
    { value: TtsRequestStatus.Cancelled, title: t('coreDam.ttsNarrationRequest.status.cancelled') },
  ])

  const getTtsRequestStatusOption = (value: TtsRequestStatus) => {
    return ttsRequestStatusOptions.value.find((item) => item.value === value)
  }

  return {
    ttsRequestStatusOptions,
    getTtsRequestStatusOption,
  }
}
