import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  apiCreateOne,
  apiFetchOne,
  apiUpdateOne,
  type DamAssetLicenceGroup,
  type IntegerId,
} from '@anzusystems/common-admin'

const END_POINT = '/adm/v1/asset-licence-group'
export const ENTITY = 'assetLicenceGroup'

export const createAssetLicenceGroup = (data: DamAssetLicenceGroup) =>
  apiCreateOne<DamAssetLicenceGroup>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAssetLicenceGroup = (id: IntegerId, data: DamAssetLicenceGroup) =>
  apiUpdateOne<DamAssetLicenceGroup>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicenceGroup = (id: IntegerId) =>
  apiFetchOne<DamAssetLicenceGroup>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
