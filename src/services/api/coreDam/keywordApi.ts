import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiFetchByIds, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { DamKeyword } from '@/types/coreDam/DamKeyword'

const END_POINT = '/adm/v1/keyword'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'keyword'

export const fetchKeywordListByIds = (extSystemId: number, ids: string[]) =>
  apiFetchByIds<DamKeyword[]>(
    damClient,
    ids,
    END_POINT_LIST + '/search',
    { extSystemId },
    SYSTEM_CORE_DAM,
    ENTITY,
    {},
    true
  )

export const fetchKeywordList = (extSystemId: number, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<DamKeyword[]>(damClient, END_POINT_LIST, { extSystemId }, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const createKeyword = (data: DamKeyword) =>
  apiCreateOne<DamKeyword>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateKeyword = (id: string, data: DamKeyword) =>
  apiUpdateOne<DamKeyword>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchKeyword = (id: string) =>
  apiFetchOne<DamKeyword>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
