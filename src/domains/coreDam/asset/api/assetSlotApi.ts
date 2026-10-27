import { useApiCommand, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'
import type { AssetFileNullable, DocId, FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin'
import type { Ref } from 'vue'

import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import { damApiBase } from '@/shared/apiClients/damApiBase'

const END_POINT = '/adm/v1/asset-slot'
export const ENTITY = 'assetSlot'

export const useFetchAssetSlotList = () =>
  useApiFetchList<AssetSlot>({ ...damApiBase, entity: ENTITY, urlTemplate: END_POINT + '/asset/:assetId' })

export const fetchAssetSlotList = (
  assetId: DocId,
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig
) => {
  const { execute } = useFetchAssetSlotList()
  return execute(pagination, filterData, filterConfig, { urlParams: { assetId } })
}

// The response is not typed here. The caller below validates it.
const useFetchAssetSlotFiles = () =>
  useApiRequest<{ data?: unknown }, null>({
    ...damApiBase,
    method: 'GET',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

/*
 * Fetches the file of every slot of the asset for the upload queue poll. The asset itself only includes its main file.
 * `report: false` keeps a failed call out of the api error logger. The error is still thrown.
 * `useApiFetchItems` cannot silence a single call, so the list is validated here.
 * A response without the list is always rejected. It is a failed read, not an asset without slots.
 */
export const fetchAssetSlotFiles = async (
  assetId: DocId,
  options?: { report?: boolean }
): Promise<AssetFileNullable[]> => {
  const body = await useFetchAssetSlotFiles().execute({ urlParams: { assetId }, report: options?.report })
  const slots = body?.data
  if (!Array.isArray(slots)) throw new Error('assetSlotApi: unexpected slot list')

  return slots.map((slot: AssetSlot) => slot.assetFile)
}

export const useUpdateAssetSlots = () =>
  useApiCommand<Array<{ assetFile: DocId | null; slotName: string }>>({
    ...damApiBase,
    method: 'PATCH',
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

export const updateAssetSlots = (assetId: DocId, data: Array<{ assetFile: DocId | null; slotName: string }>) => {
  const { execute } = useUpdateAssetSlots()
  return execute({ urlParams: { assetId }, body: data })
}
