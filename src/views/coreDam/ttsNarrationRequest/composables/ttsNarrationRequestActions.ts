import { ref } from 'vue'
import { type DocId, type FilterBag, type Pagination, useAlerts } from '@anzusystems/common-admin'
import type {
  TtsCancelRequestPayload,
  TtsCancelRequestResponse,
  TtsNarrationRequest,
  TtsSynthesizeRequest,
  TtsSynthesizeResponse,
} from '@/types/coreDam/TtsNarrationRequest'
import { TtsCancelRequestStatus, TtsRequestStatus, TtsSynthesizeStatus } from '@/types/coreDam/TtsNarrationRequest'
import {
  cancelTtsNarrationRequest,
  fetchTtsNarrationRequestList,
  synthesizeTtsNarrationRequest,
} from '@/services/api/coreDam/ttsNarrationRequestApi'

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

export const useTtsNarrationRequestListActions = () => {
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

export const useTtsNarrationRequestSynthesizeActions = () => {
  const synthesize = async (payload: TtsSynthesizeRequest): Promise<TtsSynthesizeResponse | null> => {
    synthesizeButtonLoading.value = true
    try {
      const res = await synthesizeTtsNarrationRequest(payload)
      if (res.status === TtsSynthesizeStatus.Pending) {
        showRecordWas('created')
      } else if (res.status === TtsSynthesizeStatus.AlreadyPending) {
        showWarning('coreDam.ttsNarrationRequest.synthesize.alreadyPending')
      } else if (res.status === TtsSynthesizeStatus.AlreadyExists) {
        showWarning('coreDam.ttsNarrationRequest.synthesize.alreadyExists')
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

export const useTtsNarrationRequestCancelRequestActions = () => {
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
        showWarning('coreDam.ttsNarrationRequest.cancelRequest.swapCompleted')
      } else if (res.status === TtsCancelRequestStatus.AlreadyFailed) {
        showWarning('coreDam.ttsNarrationRequest.cancelRequest.alreadyFailed')
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
