import { damClient } from '@/services/api/clients/damClient'
import type { DocId, FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiFetchList } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type {
  TtsCancelRequestPayload,
  TtsCancelRequestResponse,
  TtsNarrationRequest,
  TtsSynthesizeRequest,
  TtsSynthesizeResponse,
} from '@/types/coreDam/TtsAudio'

const END_POINT = '/adm/v1/tts-audio'
export const ENTITY = 'ttsAudio'

export const fetchTtsNarrationRequestList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<TtsNarrationRequest[]>(
    damClient,
    END_POINT + '/requests',
    {},
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const synthesizeTtsAudio = async (payload: TtsSynthesizeRequest): Promise<TtsSynthesizeResponse> => {
  const res = await damClient().post<TtsSynthesizeResponse>(`${END_POINT}/synthesize`, JSON.stringify(payload))
  return res.data
}

export const cancelTtsNarrationRequest = async (
  requestId: DocId,
  payload: TtsCancelRequestPayload
): Promise<TtsCancelRequestResponse> => {
  const res = await damClient().post<TtsCancelRequestResponse>(
    `${END_POINT}/request/${requestId}/cancel`,
    JSON.stringify(payload)
  )
  return res.data
}
