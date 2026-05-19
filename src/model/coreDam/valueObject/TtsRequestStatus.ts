import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@anzusystems/common-admin'
import { TtsRequestStatus } from '@/types/coreDam/TtsAudio'

export const ttsRequestStatusColors: Record<TtsRequestStatus, string | undefined> = {
  [TtsRequestStatus.Waiting]: 'warning',
  [TtsRequestStatus.Processing]: 'info',
  [TtsRequestStatus.Done]: 'success',
  [TtsRequestStatus.Failed]: 'error',
  [TtsRequestStatus.Cancelled]: 'grey',
}

export function useTtsRequestStatus() {
  const { t } = useI18n()

  const ttsRequestStatusOptions = ref<ValueObjectOption<TtsRequestStatus>[]>([
    { value: TtsRequestStatus.Waiting, title: t('coreDam.ttsAudio.status.waiting') },
    { value: TtsRequestStatus.Processing, title: t('coreDam.ttsAudio.status.processing') },
    { value: TtsRequestStatus.Done, title: t('coreDam.ttsAudio.status.done') },
    { value: TtsRequestStatus.Failed, title: t('coreDam.ttsAudio.status.failed') },
    { value: TtsRequestStatus.Cancelled, title: t('coreDam.ttsAudio.status.cancelled') },
  ])

  const getTtsRequestStatusOption = (value: TtsRequestStatus) => {
    return ttsRequestStatusOptions.value.find((item) => item.value === value)
  }

  return {
    ttsRequestStatusOptions,
    getTtsRequestStatusOption,
  }
}
