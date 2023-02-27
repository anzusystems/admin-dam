import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiFetchByIds, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'

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
