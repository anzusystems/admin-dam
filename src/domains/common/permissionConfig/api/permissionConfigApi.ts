import type { PermissionConfig } from '@anzusystems/common-admin'
import { apiFetchOne } from '@anzusystems/common-admin'
import type { AxiosInstance } from 'axios'

const SYSTEM = 'common'
export const ENTITY = 'permissionConfig'

export const usePermissionConfigApi = (client: () => AxiosInstance, endPoint = '/adm/v1/permissions/config') => {
  const apiFetchPermissionConfig = () => apiFetchOne<PermissionConfig>(client, endPoint, {}, SYSTEM, ENTITY)

  return {
    apiFetchPermissionConfig,
  }
}
