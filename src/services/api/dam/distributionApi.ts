import { apiFetchList, apiFetchOne } from '@/services/api/anzuApi'
import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId } from '@/types/common'
import type { Pagination } from '@/types/Pagination'
import type { FilterBag } from '@/types/Filter'
import type {
  DistributionAuthorized,
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/types/dam/Distribution'
import type { DistributionServiceName } from '@/types/dam/DamConfig'

const END_POINT = '/adm/v1/distribution'
const ENTITY = 'distribution'

export const fetchDistribution = (id: DocId) =>
  apiFetchOne<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>(
    damClient,
    END_POINT + '/:id',
    { id },
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchAssetDistributionList = (assetId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>>(
    damClient,
    END_POINT + '/asset/:assetId',
    { assetId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchAssetFileDistributionList = (assetFileId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<Array<DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem>>(
    damClient,
    END_POINT + '/asset/:assetFileId',
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
