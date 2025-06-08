import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId, FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiAnyRequest, apiFetchList } from '@anzusystems/common-admin'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'

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
