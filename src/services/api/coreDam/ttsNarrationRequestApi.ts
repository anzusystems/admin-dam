import { damClient } from '@/services/api/clients/damClient'
import type { DocId, FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiFetchByIds, apiFetchList, apiFetchOne } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type {
  TtsCancelRequestPayload,
  TtsCancelRequestResponse,
  TtsNarrationRequest,
  TtsNarrationRequestDetail,
  TtsSynthesizeRequest,
  TtsSynthesizeResponse,
} from '@/types/coreDam/TtsNarrationRequest'

const END_POINT = '/adm/v1/tts-narration-request'
export const ENTITY = 'ttsNarrationRequest'

export const fetchTtsNarrationRequest = (id: DocId) =>
  apiFetchOne<TtsNarrationRequestDetail>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchTtsNarrationRequestListByIds = (ids: DocId[]) =>
  apiFetchByIds<TtsNarrationRequest[]>(damClient, ids, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchTtsNarrationRequestList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<TtsNarrationRequest[]>(
    damClient,
    END_POINT,
    {},
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const synthesizeTtsNarrationRequest = async (payload: TtsSynthesizeRequest): Promise<TtsSynthesizeResponse> => {
  const res = await damClient().post<TtsSynthesizeResponse>(`${END_POINT}/synthesize`, JSON.stringify(payload))
  return res.data
}

export const cancelTtsNarrationRequest = async (
  requestId: DocId,
  payload: TtsCancelRequestPayload
): Promise<TtsCancelRequestResponse> => {
  const res = await damClient().post<TtsCancelRequestResponse>(
    `${END_POINT}/${requestId}/cancel`,
    JSON.stringify(payload)
  )
  return res.data
}
