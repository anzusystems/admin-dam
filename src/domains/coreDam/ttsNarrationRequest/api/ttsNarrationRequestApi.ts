import { useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type {
  TtsNarrationRequest,
  TtsNarrationRequestDetail,
  TtsSynthesizeRequestDto,
  TtsSynthesizeResponse,
} from '@/domains/coreDam/ttsNarrationRequest/types/TtsNarrationRequest'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/tts-narration-request'
export const ENTITY = 'ttsNarrationRequest'

export const useFetchTtsNarrationRequestListByExtSystem = () =>
  useApiFetchList<TtsNarrationRequest>({
    ...damApiBase,
    entity: ENTITY,
    urlTemplate: END_POINT + '/ext-system/:extSystemId',
  })

export const useFetchTtsNarrationRequest = () =>
  useApiRequest<TtsNarrationRequestDetail, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useSynthesizeTtsNarrationRequest = () =>
  useApiRequest<TtsSynthesizeResponse, TtsSynthesizeRequestDto>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT + '/synthesize',
  })

export const useCancelTtsNarrationRequest = () =>
  // POST body is an explicit empty object to match main (Symfony reads the request body).
  useApiRequest<TtsNarrationRequest, Record<string, never>>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:requestId/cancel',
  })
