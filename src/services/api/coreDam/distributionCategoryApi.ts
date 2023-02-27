import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiFetchByIds, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { DistributionCategory } from '@/types/coreDam/DistributionCategory'

const END_POINT = '/adm/v1/distribution/category'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'distributionCategory'

export const fetchDistributionCategoryListByIds = (extSystemId: number, ids: string[]) =>
  apiFetchByIds<DistributionCategory[]>(damClient, ids, END_POINT_LIST, { extSystemId }, SYSTEM_CORE_DAM, ENTITY)

export const fetchDistributionCategoryList = (extSystemId: number, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<DistributionCategory[]>(
    damClient,
    END_POINT_LIST,
    { extSystemId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const createDistributionCategory = (data: DistributionCategory) =>
  apiCreateOne<DistributionCategory>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateDistributionCategory = (id: string, data: DistributionCategory) =>
  apiUpdateOne<DistributionCategory>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchDistributionCategory = (id: string) =>
  apiFetchOne<DistributionCategory>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
