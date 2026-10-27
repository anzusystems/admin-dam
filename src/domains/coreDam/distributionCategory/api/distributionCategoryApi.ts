import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'

import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/distribution/category'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'distributionCategory'

export const useFetchDistributionCategoryListByIds = () =>
  useApiFetchByIds<DistributionCategory>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST })

export const useFetchDistributionCategoryList = () =>
  useApiFetchList<DistributionCategory>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT_LIST })

export const useCreateDistributionCategory = () =>
  useApiRequest<DistributionCategory, DistributionCategory>({
    ...damApiBase,
    method: 'POST',
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateDistributionCategory = () =>
  useApiRequest<DistributionCategory, DistributionCategory>({
    ...damApiBase,
    method: 'PUT',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchDistributionCategory = () =>
  useApiRequest<DistributionCategory, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
