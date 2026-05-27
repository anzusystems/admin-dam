import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiDeleteOne, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { PublicExport } from '@/domains/coreDam/publicExport/types/PublicExport'

const END_POINT = '/adm/v1/public-export'
export const ENTITY = 'publicExport'

export const fetchPublicExportList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<PublicExport[]>(damClient, END_POINT, {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const createPublicExport = (data: PublicExport) =>
  apiCreateOne<PublicExport>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updatePublicExport = (id: IntegerId, data: PublicExport) =>
  apiUpdateOne<PublicExport>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchPublicExport = (id: IntegerId) =>
  apiFetchOne<PublicExport>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deletePublicExport = (id: IntegerId) =>
  apiDeleteOne<PublicExport>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
