import { useApiCommand, useApiFetchList, useApiRequest } from '@anzusystems/common-admin'
import type { AssetFileNullable, DocId, FilterConfig, FilterData, Pagination } from '@anzusystems/common-admin'
import type { Ref } from 'vue'

import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const END_POINT = '/adm/v1/asset-slot'
export const ENTITY = 'assetSlot'

export const useFetchAssetSlotList = () =>
  useApiFetchList<AssetSlot>({
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
  const { execute } = useFetchAssetSlotList()
  return execute(pagination, filterData, filterConfig, { urlParams: { assetId } })
}

// The answer is taken as it comes and checked by its reader below.
const useFetchAssetSlotFiles = () =>
  useApiRequest<{ data?: unknown }, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

/* The file of every slot of the asset, for the poll of the upload queue: the asset itself speaks only of its main
 * file.
 *
 * The poll asks again and again, and says of each request whether a failure of it is to be written down:
 * `report: false` keeps this one call from the api error logger, the failure is thrown as ever. That is why it
 * is not `useApiFetchItems`, a single call of which cannot be kept quiet, and why the list is checked here. An
 * answer without its list is refused whether it is reported or not: it is a read that failed, never an asset
 * without slots. */
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
    client: damClient,
    method: 'PATCH',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/asset/:assetId',
  })

export const updateAssetSlots = (assetId: DocId, data: Array<{ assetFile: DocId | null; slotName: string }>) => {
  const { execute } = useUpdateAssetSlots()
  return execute({ urlParams: { assetId }, body: data })
}
