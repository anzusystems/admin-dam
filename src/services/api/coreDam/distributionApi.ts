import type { DocId, FilterBag, IntegerId, Pagination } from '@anzusystems/common-admin'
import { apiAnyRequest, apiDeleteOne, apiFetchList, apiFetchOne } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type {
  DistributionAuthorized,
  DistributionCustomItem, DistributionItem,
  DistributionJwItem, DistributionUpdateDto,
  DistributionYoutubeItem,
} from '@/types/coreDam/Distribution'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import type { AuthorCleanPhrase } from '@/types/coreDam/AuthorCleanPhrase.ts'

const END_POINT = '/adm/v1/distribution'
export const ENTITY = 'distribution'

export const fetchDistribution = (id: DocId) =>
  apiFetchOne<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>(
    damClient,
    END_POINT + '/:id',
    { id },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchAssetDistributionList = <T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>(
  assetId: DocId,
  pagination: Pagination,
  filterBag: FilterBag
) =>
  apiFetchList<Array<T>>(
    damClient,
    END_POINT + '/asset/:assetId',
    { assetId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchAssetFileDistributionList = <
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem,
>(
  assetFileId: DocId,
  pagination: Pagination,
  filterBag: FilterBag
) =>
  apiFetchList<Array<T>>(
    damClient,
    END_POINT + '/asset-file/:assetFileId',
    { assetFileId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const distributionIsAuthorized = (distributionServiceName: DamDistributionServiceName) =>
  apiFetchOne<DistributionAuthorized>(
    damClient,
    END_POINT + '/:distributionServiceName/authorized',
    { distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const upsertAssetDistributions = <T = DistributionUpdateDto>(
  assetId: DocId,
  data: T
) =>
  apiAnyRequest<T, T>(
    damClient,
    'PATCH',
    END_POINT,
    { assetId },
    data,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const deleteDistribution = (id: DocId) =>
  apiDeleteOne<DistributionItem>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
