import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId, FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import {
  apiCreateOne,
  apiDeleteOne,
  apiFetchByIds,
  apiFetchList,
  apiFetchOne,
  apiUpdateOne,
} from '@anzusystems/common-admin'
import type { VoiceFamily, VoiceFamilyCreate, VoiceFamilyUpdate } from '@/types/coreDam/VoiceFamily'
import { RESOURCE_VOICE_FAMILY } from '@/types/coreDam/VoiceFamily'

const END_POINT = '/adm/v1/voice-family'
export const ENTITY = RESOURCE_VOICE_FAMILY

export const fetchVoiceFamilyListByExtSystem = (
  extSystemId: IntegerId,
  pagination: Pagination,
  filterBag: FilterBag
) =>
  apiFetchList<VoiceFamily[]>(
    damClient,
    END_POINT + '/ext-system/:extSystemId',
    { extSystemId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchVoiceFamilyListByIds = (extSystemId: IntegerId, ids: DocId[]) =>
  apiFetchByIds<VoiceFamily[]>(
    damClient,
    ids,
    END_POINT + '/ext-system/:extSystemId',
    { extSystemId },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchVoiceFamily = (id: DocId) =>
  apiFetchOne<VoiceFamily>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const createVoiceFamily = (data: VoiceFamilyCreate) =>
  apiCreateOne<VoiceFamilyCreate, VoiceFamily>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateVoiceFamily = (id: DocId, data: VoiceFamilyUpdate) =>
  apiUpdateOne<VoiceFamilyUpdate, VoiceFamily>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deleteVoiceFamily = (id: DocId) =>
  apiDeleteOne<VoiceFamily>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
