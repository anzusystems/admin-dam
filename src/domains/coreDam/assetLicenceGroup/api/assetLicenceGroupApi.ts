import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { apiCreateOne, apiFetchOne, apiUpdateOne, type DamAssetLicenceGroup } from '@anzusystems/common-admin'

const END_POINT = '/adm/v1/asset-licence-group'
export const ENTITY = 'assetLicenceGroup'

export const createAssetLicenceGroup = (data: DamAssetLicenceGroup) =>
  apiCreateOne<DamAssetLicenceGroup>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAssetLicenceGroup = (id: IntegerId, data: DamAssetLicenceGroup) =>
  apiUpdateOne<DamAssetLicenceGroup>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicenceGroup = (id: IntegerId) =>
  apiFetchOne<DamAssetLicenceGroup>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
