import { damClient } from '@/services/api/clients/damClient'
import type { DocId, FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiFetchList, apiFetchOne } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type {
  TtsNarrationRequest,
  TtsNarrationRequestDetail,
  TtsSynthesizeRequestDto,
  TtsSynthesizeResponse,
} from '@/types/coreDam/TtsNarrationRequest'

const END_POINT = '/adm/v1/tts-narration-request'
export const ENTITY = 'ttsNarrationRequest'

export const fetchTtsNarrationRequestListByExtSystem = (
  extSystemId: IntegerId,
  pagination: Pagination,
  filterBag: FilterBag
) =>
  apiFetchList<TtsNarrationRequest[]>(
    damClient,
    END_POINT + '/ext-system/:extSystemId',
    { extSystemId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchTtsNarrationRequest = (id: DocId) =>
  apiFetchOne<TtsNarrationRequestDetail>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const synthesizeTtsNarrationRequest = (payload: TtsSynthesizeRequestDto) =>
  apiCreateOne<TtsSynthesizeRequestDto, TtsSynthesizeResponse>(
    damClient,
    payload,
    END_POINT + '/synthesize',
    {},
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const cancelTtsNarrationRequest = (requestId: DocId) =>
  apiCreateOne<Record<string, never>, TtsNarrationRequest>(
    damClient,
    {},
    END_POINT + '/:requestId/cancel',
    { requestId },
    SYSTEM_CORE_DAM,
    ENTITY
  )
