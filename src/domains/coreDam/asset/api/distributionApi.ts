import { useApiCommand, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'
import type { DamDistributionServiceName, DocId, FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin'
import type { Ref } from 'vue'

import type {
  DistributionAuthorized,
  DistributionCustomItem,
  DistributionJwItem,
  DistributionUpdateDto,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/distribution'
export const ENTITY = 'distribution'

export const useFetchDistribution = () =>
  useApiRequest<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchDistribution = (id: DocId) => {
  const { execute } = useFetchDistribution()
  return execute({ urlParams: { id } })
}

export const useFetchAssetDistributionList = <
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem,
>() => useApiFetchList<T>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/asset/:assetId' })

export const fetchAssetDistributionList = <T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>(
  assetId: DocId,
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig,
  signal?: AbortSignal,
  report?: boolean
) => {
  const { execute } = useFetchAssetDistributionList<T>()
  return execute(pagination, filterData, filterConfig, { urlParams: { assetId }, signal, report })
}

export const useFetchAssetFileDistributionList = <
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem,
>() => useApiFetchList<T>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/asset-file/:assetFileId' })

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
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/:distributionServiceName/authorized',
  })

export const distributionIsAuthorized = (distributionServiceName: DamDistributionServiceName, signal?: AbortSignal) => {
  const { execute } = useDistributionIsAuthorized()
  return execute({ urlParams: { distributionServiceName }, signal })
}

export const useUpsertAssetDistributions = <T extends NonNullable<unknown> = DistributionUpdateDto>() =>
  useApiRequest<T, T>({ ...damApiBase, method: 'PATCH', entity: ENTITY, urlTemplate: END_POINT })

export const upsertAssetDistributions = <T extends NonNullable<unknown> = DistributionUpdateDto>(
  _assetId: DocId,
  data: T
) => {
  const { execute } = useUpsertAssetDistributions<T>()
  return execute({ body: data })
}

export const useDeleteDistribution = () =>
  useApiCommand<null>({ ...damApiBase, method: 'DELETE', entity: ENTITY, urlTemplate: END_POINT + '/:id' })

export const deleteDistribution = (id: DocId) => {
  const { execute } = useDeleteDistribution()
  return execute({ urlParams: { id } })
}
