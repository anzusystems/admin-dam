import { apiFetchOne } from '@/services/api/anzuApi'
import type { AxiosInstance } from 'axios'
import type { PermissionConfig } from '@anzusystems/common-admin'

const SYSTEM = 'common'
export const ENTITY = 'permissionConfig'

export const usePermissionConfigApi = (client: () => AxiosInstance, endPoint = '/adm/v1/permissions/config') => {
  const apiFetchPermissionConfig = () => apiFetchOne<PermissionConfig>(client, endPoint, {}, SYSTEM, ENTITY)

  return {
    apiFetchPermissionConfig,
  }
}
