import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { VoiceFamily, VoiceFamilyCreate, VoiceFamilyUpdate } from '@/domains/coreDam/voiceFamily/types/VoiceFamily'
import { RESOURCE_VOICE_FAMILY } from '@/domains/coreDam/voiceFamily/types/VoiceFamily'

const END_POINT = '/adm/v1/voice-family'
const END_POINT_LIST_EXT_SYSTEM = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = RESOURCE_VOICE_FAMILY

export const useFetchVoiceFamilyListByExtSystem = () =>
  useApiFetchList<VoiceFamily[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST_EXT_SYSTEM,
  })

export const useFetchVoiceFamilyListByIds = () =>
  useApiFetchByIds<VoiceFamily[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST_EXT_SYSTEM,
  })

export const useFetchVoiceFamily = () =>
  useApiRequest<VoiceFamily, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useCreateVoiceFamily = () =>
  useApiRequest<VoiceFamily, VoiceFamilyCreate>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateVoiceFamily = () =>
  useApiRequest<VoiceFamily, VoiceFamilyUpdate>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteVoiceFamily = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
