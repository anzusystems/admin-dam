import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'

const END_POINT = '/adm/v1/distribution/category-select'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'distributionCategorySelect'

export const useFetchDistributionCategorySelectListByIds = () =>
  useApiFetchByIds<DistributionCategorySelect[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST,
  })

export const useFetchDistributionCategorySelectList = () =>
  useApiFetchList<DistributionCategorySelect[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST,
  })

export const useUpdateDistributionCategorySelect = () =>
  useApiRequest<DistributionCategorySelect, DistributionCategorySelect>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchDistributionCategorySelect = () =>
  useApiRequest<DistributionCategorySelect, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
