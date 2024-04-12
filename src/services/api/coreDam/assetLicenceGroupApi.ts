import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import {
  apiCreateOne,
  apiFetchByIds, apiFetchList,
  apiFetchOne,
  apiUpdateOne,
  type FilterBag,
  type IntegerId, type Pagination
} from '@anzusystems/common-admin'
import type { AssetLicenceGroup } from '@/types/coreDam/AssetLicenceGroup'
import type { AxiosInstance } from 'axios'

const END_POINT = '/adm/v1/asset-licence-group'
export const ENTITY = 'assetLicenceGroup'

export const fetchAssetLicenceGroupListByIds = (client: () => AxiosInstance, ids: IntegerId[]) =>
  apiFetchByIds<AssetLicenceGroup[]>(
    client,
    ids,
    END_POINT,
    {},
    SYSTEM_CORE_DAM,
    ENTITY,
    {},
    true
  )

export const fetchAssetLicenceGroupList = (client: () => AxiosInstance, pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<AssetLicenceGroup[]>(
    client,
    END_POINT,
    {},
    pagination,
    filterBag,
    SYSTEM_CORE_DAM,
    ENTITY
  )

export const createAssetLicenceGroup = (data: AssetLicenceGroup) =>
  apiCreateOne<AssetLicenceGroup>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updateAssetLicenceGroup = (id: IntegerId, data: AssetLicenceGroup) =>
  apiUpdateOne<AssetLicenceGroup>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAssetLicenceGroup = (id: IntegerId) =>
  apiFetchOne<AssetLicenceGroup>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)
