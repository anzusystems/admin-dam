import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiFetchOne, apiUpdateOne } from '@anzusystems/common-admin'
import type { DamAssetLicenceExtended } from '@/model/coreDam/type/AssetLicence'

const END_POINT = '/adm/v1/asset-licence'
export const ENTITY = 'assetLicence'

export const createAssetLicence = (data: DamAssetLicenceExtended) =>
  apiCreateOne<DamAssetLicenceExtended>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAssetLicence = (id: number, data: DamAssetLicenceExtended) =>
  apiUpdateOne<DamAssetLicenceExtended>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicence = (id: number) =>
  apiFetchOne<DamAssetLicenceExtended>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
