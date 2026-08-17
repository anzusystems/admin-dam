import { damClient } from '@/shared/apiClients/damClient'
import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type {
  TtsNarrationRequest,
  TtsNarrationRequestDetail,
  TtsSynthesizeRequestDto,
  TtsSynthesizeResponse,
} from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'

const END_POINT = '/adm/v1/tts-narration-request'
export const ENTITY = 'ttsNarrationRequest'

export const useFetchTtsNarrationRequestListByExtSystem = () =>
  useApiFetchList<TtsNarrationRequest[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/ext-system/:extSystemId',
  })

export const useFetchTtsNarrationRequest = () =>
  useApiRequest<TtsNarrationRequestDetail, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useSynthesizeTtsNarrationRequest = () =>
  useApiRequest<TtsSynthesizeResponse, TtsSynthesizeRequestDto>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/synthesize',
  })

export const useCancelTtsNarrationRequest = () =>
  // POST body is an explicit empty object to match main (Symfony reads the request body).
  useApiRequest<TtsNarrationRequest, Record<string, never>>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:requestId/cancel',
  })
