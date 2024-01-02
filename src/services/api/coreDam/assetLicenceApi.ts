import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { FilterBag, Pagination } from '@anzusystems/common-admin'
import { apiCreateOne, apiFetchByIds, apiFetchList, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { DamAssetLicence } from '@anzusystems/common-admin'

const END_POINT = '/adm/v1/asset-licence'
export const ENTITY = 'assetLicence'

export const fetchAssetLicenceListByIds = (ids: number[]) =>
  apiFetchByIds<DamAssetLicence[]>(damClient, ids, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicenceList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<DamAssetLicence[]>(damClient, END_POINT, {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const createAssetLicence = (data: DamAssetLicence) =>
  apiCreateOne<DamAssetLicence>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAssetLicence = (id: number, data: DamAssetLicence) =>
  apiUpdateOne<DamAssetLicence>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicence = (id: number) =>
  apiFetchOne<DamAssetLicence>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
