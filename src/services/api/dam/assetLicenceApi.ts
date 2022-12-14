import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiFetchByIds, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { Pagination } from '@/types/Pagination'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { FilterBag } from '@/types/Filter'
import type { AssetLicence } from '@/types/dam/AssetLicence'

const END_POINT = '/adm/v1/asset-licence'
export const ENTITY = 'assetLicence'

export const fetchAssetLicenceListByIds = (ids: number[]) =>
  apiFetchByIds<AssetLicence[]>(damClient, ids, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicenceList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<AssetLicence[]>(damClient, END_POINT, {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const createAssetLicence = (data: AssetLicence) =>
  apiCreateOne<AssetLicence>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAssetLicence = (id: number, data: AssetLicence) =>
  apiUpdateOne<AssetLicence>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicence = (id: number) =>
  apiFetchOne<AssetLicence>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
