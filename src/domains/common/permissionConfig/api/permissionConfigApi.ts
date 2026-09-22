import type { PermissionConfig } from '@anzusystems/common-admin'
import { useApiRequest } from '@anzusystems/common-admin/labs'
import type { AxiosInstance } from 'axios'

const SYSTEM = 'common'
export const ENTITY = 'permissionConfig'

export const usePermissionConfigApi = (client: () => AxiosInstance, endPoint = '/adm/v1/permissions/config') => {
  const useFetchPermissionConfig = () =>
    useApiRequest<PermissionConfig, null>({
      client,
      method: 'GET',
      system: SYSTEM,
      entity: ENTITY,
      urlTemplate: endPoint,
    })

  return {
    useFetchPermissionConfig,
  }
}
