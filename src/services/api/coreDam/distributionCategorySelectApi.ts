import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiFetchByIds, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'

const END_POINT = '/adm/v1/distribution/category-select'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'distributionCategorySelect'

export const fetchDistributionCategorySelectListByIds = (extSystemId: number, ids: string[]) =>
  apiFetchByIds<DistributionCategorySelect[]>(damClient, ids, END_POINT_LIST, { extSystemId }, SYSTEM_CORE_DAM, ENTITY)

export const fetchDistributionCategorySelectList = (
  extSystemId: number,
  pagination: Pagination,
  filterBag: FilterBag
) =>
  apiFetchList<DistributionCategorySelect[]>(
    damClient,
    END_POINT_LIST,
    { extSystemId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const updateDistributionCategorySelect = (id: string, data: DistributionCategorySelect) =>
  apiUpdateOne<DistributionCategorySelect>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchDistributionCategorySelect = (id: string) =>
  apiFetchOne<DistributionCategorySelect>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
