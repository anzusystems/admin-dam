import { useApiCommand, useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { VoiceFamily, VoiceFamilyCreate, VoiceFamilyUpdate } from '@/domains/coreDam/voiceFamily/types/VoiceFamily'
import { RESOURCE_VOICE_FAMILY } from '@/domains/coreDam/voiceFamily/types/VoiceFamily'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/voice-family'
const END_POINT_LIST_EXT_SYSTEM = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = RESOURCE_VOICE_FAMILY

export const useFetchVoiceFamilyListByExtSystem = () =>
  useApiFetchList<VoiceFamily>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST_EXT_SYSTEM })

export const useFetchVoiceFamilyListByIds = () =>
  useApiFetchByIds<VoiceFamily>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST_EXT_SYSTEM })

export const useFetchVoiceFamily = () =>
  useApiRequest<VoiceFamily, null>({ ...damApiBase, method: 'GET', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const useCreateVoiceFamily = () =>
  useApiRequest<VoiceFamily, VoiceFamilyCreate>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateVoiceFamily = () =>
  useApiRequest<VoiceFamily, VoiceFamilyUpdate>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeleteVoiceFamily = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })
