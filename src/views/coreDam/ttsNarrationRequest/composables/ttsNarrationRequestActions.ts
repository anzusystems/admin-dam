import { ref } from 'vue'
import { type DocId, useAlerts } from '@anzusystems/common-admin'
import type { TtsNarrationRequest, TtsSynthesizeRequest } from '@/types/coreDam/TtsNarrationRequest'
import { TtsRequestStatus } from '@/types/coreDam/TtsNarrationRequest'
import { cancelTtsNarrationRequest, synthesizeTtsNarrationRequest } from '@/services/api/coreDam/ttsNarrationRequestApi'

const { showRecordWas, showErrorsDefault } = useAlerts()

const CANCELLABLE_STATUSES: ReadonlyArray<TtsRequestStatus> = [
  TtsRequestStatus.Waiting,
  TtsRequestStatus.Processing,
]

export const isCancellableRequest = (request: TtsNarrationRequest): boolean =>
  !request.cancelRequested && CANCELLABLE_STATUSES.includes(request.status)

const synthesizeButtonLoading = ref(false)
const cancelRequestButtonLoading = ref(false)

export const useTtsNarrationRequestSynthesizeActions = () => {
  const synthesize = async (payload: TtsSynthesizeRequest): Promise<TtsNarrationRequest | null> => {
    synthesizeButtonLoading.value = true
    try {
      const res = await synthesizeTtsNarrationRequest(payload)
      showRecordWas('created')
      return res
    } catch (error) {
      showErrorsDefault(error)
      return null
    } finally {
      synthesizeButtonLoading.value = false
    }
  }

  return {
    synthesizeButtonLoading,
    synthesize,
  }
}

export const useTtsNarrationRequestCancelRequestActions = () => {
  const cancelRequest = async (requestId: DocId): Promise<TtsNarrationRequest | null> => {
    cancelRequestButtonLoading.value = true
    try {
      const res = await cancelTtsNarrationRequest(requestId)
      showRecordWas('updated')
      return res
    } catch (error) {
      showErrorsDefault(error)
      return null
    } finally {
      cancelRequestButtonLoading.value = false
    }
  }

  return {
    cancelRequestButtonLoading,
    cancelRequest,
  }
}
