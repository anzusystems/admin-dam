import { damClient } from '@/shared/apiClients/damClient'
import {
  type FilterConfig,
  type FilterData,
  type Pagination,
  useApiFetchList,
  useApiRequest,
} from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { RegionOfInterest } from '@/domains/coreDam/asset/types/Roi'
import type { Ref } from 'vue'

export interface AssetMetadataBulkItem {
  id: DocId
  title: string
  description: string
  described: boolean
}

const END_POINT = '/adm/v1/roi'
const END_POINT_IMAGE_ROI = '/adm/v1/image/:id/roi'
export const ENTITY = 'asset'

export const useFetchRoi = () =>
  useApiRequest<RegionOfInterest, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const fetchRoi = (id: DocId) => {
  const { executeRequest } = useFetchRoi()
  return executeRequest({ urlParams: { id } })
}

export const useUpdateRoi = () =>
  useApiRequest<RegionOfInterest, RegionOfInterest>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const updateRoi = (id: DocId, data: RegionOfInterest) => {
  const { executeRequest } = useUpdateRoi()
  return executeRequest({ urlParams: { id }, object: data })
}

export const useFetchImageRoiList = () =>
  useApiFetchList<RegionOfInterest[]>({
    client: damClient,
    system: SYSTEM_CORE_DAM,
    entity: ENTITY,
    urlTemplate: END_POINT_IMAGE_ROI,
  })

export const fetchImageRoiList = (
  imageId: DocId,
  pagination: Ref<Pagination>,
  filterData: FilterData,
  filterConfig: FilterConfig
) => {
  const { executeFetch } = useFetchImageRoiList()
  return executeFetch(pagination, filterData, filterConfig, { urlParams: { id: imageId } })
}
