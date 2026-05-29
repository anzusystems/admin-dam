import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import {
  type FilterConfig,
  type FilterData,
  type Pagination,
  useApiFetchList,
  useApiRequest,
} from '@anzusystems/common-admin/labs'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type {
  DistributionAuthorized,
  DistributionCustomItem,
  DistributionItem,
  DistributionJwItem,
  DistributionUpdateDto,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
import type { Ref } from 'vue'

const END_POINT = '/adm/v1/distribution'
export const ENTITY = 'distribution'

export const useFetchDistribution = () =>
  useApiRequest<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchDistribution = (id: DocId) => {
  const { executeRequest } = useFetchDistribution()
  return executeRequest({ urlParams: { id } })
}

export const useFetchAssetDistributionList = <
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem,
>() =>
  useApiFetchList<Array<T>>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

export const fetchAssetDistributionList = <T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>(
  assetId: DocId,
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig
) => {
  const { executeFetch } = useFetchAssetDistributionList<T>()
  return executeFetch(pagination, filterData, filterConfig, { urlParams: { assetId } })
}

export const useFetchAssetFileDistributionList = <
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem,
>() =>
  useApiFetchList<Array<T>>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset-file/:assetFileId',
  })

export const fetchAssetFileDistributionList = <
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem,
>(
  assetFileId: DocId,
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig
) => {
  const { executeFetch } = useFetchAssetFileDistributionList<T>()
  return executeFetch(pagination, filterData, filterConfig, { urlParams: { assetFileId } })
}

export const useDistributionIsAuthorized = () =>
  useApiRequest<DistributionAuthorized, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/authorized',
  })

export const distributionIsAuthorized = (distributionServiceName: DamDistributionServiceName) => {
  const { executeRequest } = useDistributionIsAuthorized()
  return executeRequest({ urlParams: { distributionServiceName } })
}

export const useUpsertAssetDistributions = <T = DistributionUpdateDto>() =>
  useApiRequest<T, T>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const upsertAssetDistributions = <T = DistributionUpdateDto>(_assetId: DocId, data: T) => {
  const { executeRequest } = useUpsertAssetDistributions<T>()
  return executeRequest({ object: data })
}

export const useDeleteDistribution = () =>
  useApiRequest<DistributionItem, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const deleteDistribution = (id: DocId) => {
  const { executeRequest } = useDeleteDistribution()
  return executeRequest({ urlParams: { id } })
}
