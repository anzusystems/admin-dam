import { ref } from 'vue'
import { type DocId, type FilterBag, type Pagination, useAlerts } from '@anzusystems/common-admin'
import type {
  TtsCancelRequestPayload,
  TtsCancelRequestResponse,
  TtsNarrationRequest,
  TtsSynthesizeRequest,
  TtsSynthesizeResponse,
} from '@/types/coreDam/TtsAudio'
import { TtsCancelRequestStatus, TtsRequestStatus, TtsSynthesizeStatus } from '@/types/coreDam/TtsAudio'
import {
  cancelTtsNarrationRequest,
  fetchTtsNarrationRequestList,
  synthesizeTtsAudio,
} from '@/services/api/coreDam/ttsAudioApi'

const { showRecordWas, showErrorsDefault, showWarning } = useAlerts()

const CANCELLABLE_STATUSES: ReadonlyArray<TtsRequestStatus> = [
  TtsRequestStatus.Waiting,
  TtsRequestStatus.Processing,
]

export const isCancellableRequest = (request: TtsNarrationRequest): boolean =>
  !request.cancelRequested && CANCELLABLE_STATUSES.includes(request.status)

const datatableHiddenColumns = ref<Array<string>>([])
const listLoading = ref(false)
const synthesizeButtonLoading = ref(false)
const cancelRequestButtonLoading = ref(false)

export const useTtsAudioListActions = () => {
  const listItems = ref<Array<TtsNarrationRequest>>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchTtsNarrationRequestList(pagination, filterBag)
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      listLoading.value = false
    }
  }

  return {
    datatableHiddenColumns,
    listLoading,
    listItems,
    fetchList,
  }
}

export const useTtsAudioSynthesizeActions = () => {
  const synthesize = async (payload: TtsSynthesizeRequest): Promise<TtsSynthesizeResponse | null> => {
    synthesizeButtonLoading.value = true
    try {
      const res = await synthesizeTtsAudio(payload)
      if (res.status === TtsSynthesizeStatus.Pending) {
        showRecordWas('created')
      } else if (res.status === TtsSynthesizeStatus.AlreadyPending) {
        showWarning('coreDam.ttsAudio.synthesize.alreadyPending')
      } else if (res.status === TtsSynthesizeStatus.AlreadyExists) {
        showWarning('coreDam.ttsAudio.synthesize.alreadyExists')
      }
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

export const useTtsAudioCancelRequestActions = () => {
  const cancelRequest = async (
    requestId: DocId,
    payload: TtsCancelRequestPayload
  ): Promise<TtsCancelRequestResponse | null> => {
    cancelRequestButtonLoading.value = true
    try {
      const res = await cancelTtsNarrationRequest(requestId, payload)
      if (res.status === TtsCancelRequestStatus.Cancelled) {
        showRecordWas('updated')
      } else if (res.status === TtsCancelRequestStatus.SwapCompleted) {
        showWarning('coreDam.ttsAudio.cancelRequest.swapCompleted')
      } else if (res.status === TtsCancelRequestStatus.AlreadyFailed) {
        showWarning('coreDam.ttsAudio.cancelRequest.alreadyFailed')
      }
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
