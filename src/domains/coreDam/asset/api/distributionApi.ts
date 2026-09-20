import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import {
  type FilterConfig,
  type FilterData,
  type Pagination,
  useApiCommand,
  useApiFetchList,
  useApiRequest,
} from '@anzusystems/common-admin/labs'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type {
  DistributionAuthorized,
  DistributionCustomItem,
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
  const { execute } = useFetchDistribution()
  return execute({ urlParams: { id } })
}

export const useFetchAssetDistributionList = <
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem,
>() =>
  useApiFetchList<T>({
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
  const { execute } = useFetchAssetDistributionList<T>()
  return execute(pagination, filterData, filterConfig, { urlParams: { assetId } })
}

export const useFetchAssetFileDistributionList = <
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem,
>() =>
  useApiFetchList<T>({
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
  const { execute } = useFetchAssetFileDistributionList<T>()
  return execute(pagination, filterData, filterConfig, { urlParams: { assetFileId } })
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
  const { execute } = useDistributionIsAuthorized()
  return execute({ urlParams: { distributionServiceName } })
}

export const useUpsertAssetDistributions = <T extends NonNullable<unknown> = DistributionUpdateDto>() =>
  useApiRequest<T, T>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const upsertAssetDistributions = <T extends NonNullable<unknown> = DistributionUpdateDto>(
  _assetId: DocId,
  data: T
) => {
  const { execute } = useUpsertAssetDistributions<T>()
  return execute({ body: data })
}

export const useDeleteDistribution = () =>
  useApiCommand<null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const deleteDistribution = (id: DocId) => {
  const { execute } = useDeleteDistribution()
  return execute({ urlParams: { id } })
}
