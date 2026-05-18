import { damClient } from '@/services/api/clients/damClient'
import type { FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import { apiFetchList } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type {
  JobAudioNarration,
  TtsCancelJobRequest,
  TtsCancelJobResponse,
  TtsSynthesizeRequest,
  TtsSynthesizeResponse,
} from '@/types/coreDam/TtsAudio'

const END_POINT = '/adm/v1/tts-audio'
export const ENTITY = 'ttsAudio'

export const fetchTtsAudioJobList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<JobAudioNarration[]>(damClient, END_POINT + '/jobs', {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const synthesizeTtsAudio = async (payload: TtsSynthesizeRequest): Promise<TtsSynthesizeResponse> => {
  const res = await damClient().post<TtsSynthesizeResponse>(`${END_POINT}/synthesize`, JSON.stringify(payload))
  return res.data
}

export const cancelTtsAudioJob = async (
  jobId: IntegerId,
  payload: TtsCancelJobRequest
): Promise<TtsCancelJobResponse> => {
  const res = await damClient().post<TtsCancelJobResponse>(`${END_POINT}/job/${jobId}/cancel`, JSON.stringify(payload))
  return res.data
}
