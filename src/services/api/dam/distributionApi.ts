import { apiFetchList, apiFetchOne } from '@/services/api/anzuApi'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId } from '@anzusystems/common-admin'
import type { Pagination } from '@anzusystems/common-admin'
import type { FilterBag } from '@anzusystems/common-admin'
import type {
  DistributionAuthorized,
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/types/dam/Distribution'
import type { DistributionServiceName } from '@/types/dam/DamConfig'

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
  T = DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
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

export const distributionIsAuthorized = (distributionServiceName: DistributionServiceName) =>
  apiFetchOne<DistributionAuthorized>(
    damClient,
    END_POINT + '/:distributionServiceName/authorized',
    { distributionServiceName },
    SYSTEM_CORE_DAM,
    ENTITY
  )
