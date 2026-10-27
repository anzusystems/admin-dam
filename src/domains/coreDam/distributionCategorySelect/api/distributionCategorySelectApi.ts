import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/distribution/category-select'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'distributionCategorySelect'

export const useFetchDistributionCategorySelectListByIds = () =>
  useApiFetchByIds<DistributionCategorySelect>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST })

export const useFetchDistributionCategorySelectList = () =>
  useApiFetchList<DistributionCategorySelect>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST })

export const useUpdateDistributionCategorySelect = () =>
  useApiRequest<DistributionCategorySelect, DistributionCategorySelect>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchDistributionCategorySelect = () =>
  useApiRequest<DistributionCategorySelect, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
