import { damClient } from '@/services/api/clients/damClient'
import type { FilterBag } from '@/types/Filter'
import type { Pagination } from '@/types/Pagination'
import { apiFetchList, apiFetchOne } from '@/services/api/anzuApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type {
  AssetExternalProviderDetailDto,
  AssetExternalProviderId,
  AssetExternalProviderListDto,
} from '@/types/dam/AssetExternalProvider'

const END_POINT = '/adm/v1/asset-external-provider'
export const ENTITY = 'asset'

export const fetchExternalProviderAssetList = (
  externalProvider: string,
  pagination: Pagination,
  filterBag: FilterBag
) =>
  apiFetchList<AssetExternalProviderListDto[]>(
    damClient,
    END_POINT + '/:externalProvider',
    { externalProvider },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const fetchExternalProviderAsset = (externalProvider: string, id: AssetExternalProviderId) =>
  apiFetchOne<AssetExternalProviderDetailDto>(
    damClient,
    END_POINT + '/:externalProvider/:id',
    { externalProvider, id },
    SYSTEM_CORE_DAM,
    ENTITY
  )
