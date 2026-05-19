import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId, FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiDeleteOne, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { Voice } from '@/types/coreDam/Voice'
import { RESOURCE_VOICE } from '@/types/coreDam/Voice'

const END_POINT_FAMILY = '/adm/v1/voice/voice-family'
const END_POINT = '/adm/v1/voice'
export const ENTITY = RESOURCE_VOICE

export const fetchVoiceListByFamily = (voiceFamilyId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<Voice[]>(
    damClient,
    END_POINT_FAMILY + '/:voiceFamilyId',
    { voiceFamilyId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY,
  )

export const fetchVoice = (id: DocId) =>
  apiFetchOne<Voice>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const createVoice = (data: Voice) =>
  apiCreateOne<Voice>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateVoice = (id: DocId, data: Voice) =>
  apiUpdateOne<Voice>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deleteVoice = (id: DocId) =>
  apiDeleteOne<Voice>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
