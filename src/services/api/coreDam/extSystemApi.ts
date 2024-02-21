import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamExtSystem } from '@anzusystems/common-admin'
import { apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'

const END_POINT = '/adm/v1/ext-system'
export const ENTITY = 'extSystem'

export const updateExtSystem = (id: number, data: DamExtSystem) =>
  apiUpdateOne<DamExtSystem>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystem = (id: number) =>
  apiFetchOne<DamExtSystem>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
