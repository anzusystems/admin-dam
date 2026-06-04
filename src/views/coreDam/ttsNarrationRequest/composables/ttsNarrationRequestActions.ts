import { ref } from 'vue'
import { type DocId, type FilterBag, type Pagination, useAlerts } from '@anzusystems/common-admin'
import type { TtsNarrationRequest, TtsSynthesizeRequestDto, TtsSynthesizeResponse } from '@/types/coreDam/TtsNarrationRequest'
import { TtsRequestStatus } from '@/types/coreDam/TtsNarrationRequest'
import {
  cancelTtsNarrationRequest,
  fetchTtsNarrationRequestListByExtSystem,
  synthesizeTtsNarrationRequest,
} from '@/services/api/coreDam/ttsNarrationRequestApi'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const { showRecordWas, showErrorsDefault } = useAlerts()

const CANCELLABLE_STATUSES: ReadonlyArray<TtsRequestStatus> = [
  TtsRequestStatus.Waiting,
  TtsRequestStatus.Processing,
]

export const isCancellableRequest = (request: TtsNarrationRequest): boolean =>
  !request.cancelRequested && CANCELLABLE_STATUSES.includes(request.status)

const datatableHiddenColumns = ref<Array<string>>([])
const listLoading = ref(false)
const cancelRequestButtonLoading = ref(false)

export const useTtsNarrationRequestListActions = () => {
  const { currentExtSystemId } = useCurrentExtSystem()
  const listItems = ref<Array<TtsNarrationRequest>>([])

  const fetchList = async (pagination: Pagination, filterBag: FilterBag) => {
    listLoading.value = true
    try {
      listItems.value = await fetchTtsNarrationRequestListByExtSystem(currentExtSystemId.value, pagination, filterBag)
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
  // Passed to ACreateDialog's call-create; the dialog owns loading + error/success handling.
  const synthesize = (payload: TtsSynthesizeRequestDto): Promise<TtsSynthesizeResponse> =>
    synthesizeTtsNarrationRequest(payload)

  return {
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
