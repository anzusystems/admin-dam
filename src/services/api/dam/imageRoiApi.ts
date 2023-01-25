import { damClient } from '@/services/api/clients/damClient'
import type { FilterBag } from '@/types/Filter'
import type { Pagination } from '@/types/Pagination'
import { apiFetchList, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DocId } from '@anzusystems/common-admin'
import type { RegionOfInterest } from '@/types/dam/Roi'

export interface AssetMetadataBulkItem {
  id: DocId
  title: string
  description: string
  described: boolean
}

const END_POINT = '/adm/v1/roi'
const END_POINT_IMAGE_ROI = '/adm/v1/image/:id/roi'
export const ENTITY = 'asset'

export const fetchRoi = (id: DocId) =>
  apiFetchOne<RegionOfInterest>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const updateRoi = (id: DocId, data: RegionOfInterest) =>
  apiUpdateOne<RegionOfInterest>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchImageRoiList = (imageId: DocId, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<any[]>(damClient, END_POINT_IMAGE_ROI, { id: imageId }, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)
