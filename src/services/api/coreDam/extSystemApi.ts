import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'

const END_POINT = '/adm/v1/ext-system'
export const ENTITY = 'extSystem'

export const updateExtSystem = (id: number, data: ExtSystem) =>
  apiUpdateOne<ExtSystem>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchExtSystem = (id: number) =>
  apiFetchOne<ExtSystem>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
