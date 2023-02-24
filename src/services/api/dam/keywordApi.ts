import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiFetchByIds, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { Keyword } from '@/types/dam/Keyword'

const END_POINT = '/adm/v1/keyword'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'keyword'

export const fetchKeywordListByIds = (extSystemId: number, ids: string[]) =>
  apiFetchByIds<Keyword[]>(
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
  apiFetchList<Keyword[]>(damClient, END_POINT_LIST, { extSystemId }, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const createKeyword = (data: Keyword) =>
  apiCreateOne<Keyword>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateKeyword = (id: string, data: Keyword) =>
  apiUpdateOne<Keyword>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchKeyword = (id: string) =>
  apiFetchOne<Keyword>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
