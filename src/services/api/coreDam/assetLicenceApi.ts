import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import type { DamAssetLicence } from '@anzusystems/common-admin'
import { apiCreateOne, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'

const END_POINT = '/adm/v1/asset-licence'
export const ENTITY = 'assetLicence'

export const createAssetLicence = (data: DamAssetLicence) =>
  apiCreateOne<DamAssetLicence>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAssetLicence = (id: number, data: DamAssetLicence) =>
  apiUpdateOne<DamAssetLicence>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicence = (id: number) =>
  apiFetchOne<DamAssetLicence>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
