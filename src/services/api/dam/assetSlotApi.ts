import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { Pagination } from '@/types/Pagination'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { FilterBag } from '@/types/Filter'
import type { DocId } from '@/types/common'
import type { AssetSlot } from '@/types/dam/AssetSlot'

const END_POINT = '/adm/v1/asset-slot'
export const ENTITY = 'assetSlot'

export const fetchAssetSlotList = (assetId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<AssetSlot[]>(
    damClient,
    END_POINT + '/asset/:assetId',
    { assetId },
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )
