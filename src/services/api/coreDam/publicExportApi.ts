import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiDeleteOne, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { PublicExport } from '@/types/coreDam/PublicExport'

const END_POINT = '/adm/v1/public-export'
export const ENTITY = 'publicExport'

export const fetchPublicExportList = (extSystemId: number, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<PublicExport[]>(
    damClient,
    END_POINT_LIST,
    {
      extSystemId,
    },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const createPublicExport = (data: PublicExport) =>
  apiCreateOne<PublicExport>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updatePublicExport = (id: string, data: PublicExport) =>
  apiUpdateOne<PublicExport>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchPublicExport = (id: string) =>
  apiFetchOne<PublicExport>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const deletePublicExport = (id: IntegerId) =>
  apiDeleteOne<PublicExport>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
