import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiFetchByIds, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { DamExtSystem } from '@/types/coreDam/DamExtSystem'

const END_POINT = '/adm/v1/ext-system'
export const ENTITY = 'extSystem'

export const fetchExtSystemListByIds = (ids: number[]) =>
  apiFetchByIds<DamExtSystem[]>(damClient, ids, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystemList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<DamExtSystem[]>(damClient, END_POINT, {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const updateExtSystem = (id: number, data: DamExtSystem) =>
  apiUpdateOne<DamExtSystem>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystem = (id: number) =>
  apiFetchOne<DamExtSystem>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
