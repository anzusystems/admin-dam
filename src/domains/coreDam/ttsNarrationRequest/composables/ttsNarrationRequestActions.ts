import type { Ref } from 'vue'
import { ref } from 'vue'
import { type DocId, useAlerts } from '@anzusystems/common-admin'
import type { FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin/labs'
import type {
  TtsNarrationRequest,
  TtsNarrationRequestDetail,
  TtsSynthesizeRequestDto,
  TtsSynthesizeResponse,
} from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'
import { TtsRequestStatus, type TtsRequestStatusType } from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'
import {
  useCancelTtsNarrationRequest,
  useFetchTtsNarrationRequest,
  useFetchTtsNarrationRequestListByExtSystem,
  useSynthesizeTtsNarrationRequest,
} from '@/domains/coreDam/ttsNarrationRequest/api/ttsNarrationRequestApi'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useCachedAssetLicences } from '@/domains/coreDam/assetLicence/composables/cachedAssetLicences'
import { useCachedExtSystems } from '@/domains/coreDam/extSystem/composables/cachedExtSystems'
import { useCachedVoiceFamiliesById } from '@/domains/coreDam/voiceFamily/composables/cachedVoiceFamilies'

const { showRecordWas, showErrorsDefault } = useAlerts()

const CANCELLABLE_STATUSES: ReadonlyArray<TtsRequestStatusType> = [
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
  const { executeFetch } = useFetchTtsNarrationRequestListByExtSystem()
  const listItems = ref<Array<TtsNarrationRequest>>([])

  const fetchList = async (pagination: Ref<Pagination>, filterData: FilterData, filterConfig: FilterConfig) => {
    listLoading.value = true
    try {
      listItems.value = await executeFetch(pagination, filterData, filterConfig, {
        urlParams: { extSystemId: currentExtSystemId.value },
      })
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
  const { executeRequest: synthesizeTtsNarrationRequest } = useSynthesizeTtsNarrationRequest()

  // Passed to ACreateDialog's call-create; the dialog owns loading + error/success handling.
  const synthesize = (payload: TtsSynthesizeRequestDto): Promise<TtsSynthesizeResponse> =>
    synthesizeTtsNarrationRequest({ object: payload })

  return {
    synthesize,
  }
}

export const useTtsNarrationRequestCancelRequestActions = () => {
  const { executeRequest: cancelTtsNarrationRequest } = useCancelTtsNarrationRequest()

  const cancelRequest = async (requestId: DocId): Promise<TtsNarrationRequest | null> => {
    cancelRequestButtonLoading.value = true
    try {
      const res = await cancelTtsNarrationRequest({ urlParams: { requestId }, object: {} })
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

export const useTtsNarrationRequestDetailActions = (getId: () => DocId) => {
  const { addToCachedAssetLicences, fetchCachedAssetLicences } = useCachedAssetLicences()
  const { addToCachedExtSystems, fetchCachedExtSystems } = useCachedExtSystems()
  const { addToCachedVoiceFamilies, fetchCachedVoiceFamilies, isLoadedCachedVoiceFamily } = useCachedVoiceFamiliesById()
  const { executeRequest: fetchTtsNarrationRequest } = useFetchTtsNarrationRequest()

  const detail = ref<TtsNarrationRequestDetail | null>(null)
  const detailLoading = ref(true)

  // Snapshot fetch — admin does not poll; the user reloads to see progress.
  const fetchDetail = async () => {
    detailLoading.value = true
    try {
      const data = await fetchTtsNarrationRequest({ urlParams: { id: getId() } })
      detail.value = data
      if (data) {
        addToCachedAssetLicences([data.assetLicence])
        fetchCachedAssetLicences()
        addToCachedExtSystems([data.extSystemId])
        fetchCachedExtSystems()
        const voiceFamilyId = data.ttsAsset?.voiceFamily
        if (voiceFamilyId && !isLoadedCachedVoiceFamily(voiceFamilyId)) {
          addToCachedVoiceFamilies([voiceFamilyId])
          fetchCachedVoiceFamilies()
        }
      }
    } catch (error) {
      showErrorsDefault(error)
    } finally {
      detailLoading.value = false
    }
  }

  return {
    detail,
    detailLoading,
    fetchDetail,
  }
}
