import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiAnyRequest, apiFetchList } from '@anzusystems/common-admin'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'

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

export const updateAssetSlots = (assetId: DocId, data: Array<{ assetFile: DocId | null; slotName: string }>) =>
  apiAnyRequest(damClient, 'PATCH', END_POINT + '/asset/:assetId', { assetId }, data, SYSTEM_CORE_DAM, ENTITY)
