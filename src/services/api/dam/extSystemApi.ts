import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiFetchByIds, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { Pagination } from '@anzusystems/common-admin'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { FilterBag } from '@anzusystems/common-admin'
import type { ExtSystem } from '@/types/dam/ExtSystem'

const END_POINT = '/adm/v1/ext-system'
export const ENTITY = 'extSystem'

export const fetchExtSystemListByIds = (ids: number[]) =>
  apiFetchByIds<ExtSystem[]>(damClient, ids, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystemList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<ExtSystem[]>(damClient, END_POINT, {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const updateExtSystem = (id: number, data: ExtSystem) =>
  apiUpdateOne<ExtSystem>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystem = (id: number) =>
  apiFetchOne<ExtSystem>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
