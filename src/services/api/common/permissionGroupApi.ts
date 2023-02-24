import {
  apiCreateOne,
  apiDeleteOne,
  apiFetchByIds,
  apiFetchList,
  apiFetchOne,
  apiUpdateOne,
} from '@/services/api/anzuApi'
import type { FilterBag, IntegerId, Pagination, PermissionGroup } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'

const SYSTEM = 'common'
export const ENTITY = 'permissionGroup'

export const usePermissionGroupApi = (client: () => AxiosInstance, endPoint = '/adm/v1/permission-group') => {
  const apiFetchPermissionGroupListByIds = (ids: IntegerId[]) =>
    apiFetchByIds<PermissionGroup[]>(client, ids, endPoint, {}, SYSTEM, ENTITY)

  const apiFetchPermissionGroupList = (pagination: Pagination, filterBag: FilterBag) =>
    apiFetchList<PermissionGroup[]>(client, endPoint, {}, pagination, filterBag, SYSTEM, ENTITY)

  const apiFetchPermissionGroup = (id: IntegerId) =>
    apiFetchOne<PermissionGroup>(client, endPoint + '/:id', { id }, SYSTEM, ENTITY)

  const apiCreatePermissionGroup = (data: PermissionGroup) =>
    apiCreateOne<PermissionGroup>(client, data, endPoint, {}, SYSTEM, ENTITY)

  const apiUpdatePermissionGroup = (id: IntegerId, data: PermissionGroup) =>
    apiUpdateOne<PermissionGroup>(client, data, endPoint + '/:id', { id }, SYSTEM, ENTITY)

  const apiDeletePermissionGroup = (id: IntegerId) =>
    apiDeleteOne<PermissionGroup>(client, endPoint + '/:id', { id }, SYSTEM, ENTITY)

  return {
    apiFetchPermissionGroupListByIds,
    apiFetchPermissionGroupList,
    apiFetchPermissionGroup,
    apiCreatePermissionGroup,
    apiUpdatePermissionGroup,
    apiDeletePermissionGroup,
  }
}
