import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'

const END_POINT = '/adm/v1/distribution/category'
const END_POINT_LIST = END_POINT + '/ext-system/:extSystemId'
export const ENTITY = 'distributionCategory'

export const useFetchDistributionCategoryListByIds = () =>
  useApiFetchByIds<DistributionCategory[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST,
  })

export const useFetchDistributionCategoryList = () =>
  useApiFetchList<DistributionCategory[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_LIST,
  })

export const useCreateDistributionCategory = () =>
  useApiRequest<DistributionCategory, DistributionCategory>({
    client: damClient,
    method: 'POST',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdateDistributionCategory = () =>
  useApiRequest<DistributionCategory, DistributionCategory>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useFetchDistributionCategory = () =>
  useApiRequest<DistributionCategory, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
