import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import {
  type FilterConfig,
  type FilterData,
  type Pagination,
  useApiFetchList,
  useApiRequest,
} from '@anzusystems/common-admin/labs'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import type { Ref } from 'vue'

const END_POINT = '/adm/v1/asset-slot'
export const ENTITY = 'assetSlot'

export const useFetchAssetSlotList = () =>
  useApiFetchList<AssetSlot[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

export const fetchAssetSlotList = (
  assetId: DocId,
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig
) => {
  const { executeFetch } = useFetchAssetSlotList()
  return executeFetch(pagination, filterData, filterConfig, { urlParams: { assetId } })
}

export const useUpdateAssetSlots = () =>
  useApiRequest<unknown, Array<{ assetFile: DocId | null; slotName: string }>>({
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

export const updateAssetSlots = (assetId: DocId, data: Array<{ assetFile: DocId | null; slotName: string }>) => {
  const { executeRequest } = useUpdateAssetSlots()
  return executeRequest({ urlParams: { assetId }, object: data })
}
