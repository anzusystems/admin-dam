import { damClient } from '@/services/api/clients/damClient'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { apiCreateOne, apiFetchByIds, apiFetchOne, apiUpdateOne } from '@/services/api/anzuApi'
import type { Pagination } from '@/types/Pagination'
import { apiFetchList } from '@/services/api/anzuApi/apiFetchList'
import type { FilterBag } from '@/types/Filter'
import type { PermissionGroup } from '@/types/dam/PermissionGroup'
import { isValidHTTPStatus } from '@/services/api/statusCodes'
import { AnzuApiResponseCodeError } from '@/model/common/error/AnzuApiResponseCodeError'
import { AnzuApiValidationError } from '@/model/common/error/AnzuApiValidationError'
import { useErrorHandler } from '@/composables/system/error'
import type { PermissionDetails, Permissions } from '@/types/Permission'

const END_POINT = '/adm/v1/permission-group'
export const ENTITY = 'permissionGroup'

const { isValidationError, handleValidationError } = useErrorHandler()

export const fetchPermissionGroupListByIds = (ids: number[]) =>
  apiFetchByIds<PermissionGroup[]>(damClient, ids, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const fetchPermissionGroupList = (pagination: Pagination, filterBag: FilterBag) =>
  apiFetchList<PermissionGroup[]>(damClient, END_POINT, {}, pagination, filterBag, SYSTEM_CORE_DAM, ENTITY)

export const createPermissionGroup = (data: PermissionGroup) =>
  apiCreateOne<PermissionGroup>(damClient, data, END_POINT, {}, SYSTEM_CORE_DAM, ENTITY)

export const updatePermissionGroup = (id: number, data: PermissionGroup) =>
  apiUpdateOne<PermissionGroup>(damClient, data, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchPermissionGroup = (id: number) =>
  apiFetchOne<PermissionGroup>(damClient, END_POINT + '/:id', { id }, SYSTEM_CORE_DAM, ENTITY)

export const fetchAllPermissionDetails = (): Promise<PermissionDetails> => {
  return new Promise((resolve, reject) => {
    damClient()
      .get(END_POINT + '/all-details')
      .then((res) => {
        if (!isValidHTTPStatus(res.status)) {
          throw new AnzuApiResponseCodeError()
        }
        resolve(res.data)
      })
      .catch((err) => {
        if (isValidationError(err)) {
          handleValidationError(err, SYSTEM_CORE_DAM, ENTITY)
          reject(new AnzuApiValidationError())
        }
        reject(err)
      })
  })
}

export const fetchGroupsPermissionsPreview = (ids: number[]): Promise<Permissions> => {
  return new Promise((resolve, reject) => {
    damClient()
      .post(END_POINT + '/preview', { permissionGroups: ids })
      .then((res) => {
        if (!isValidHTTPStatus(res.status)) {
          throw new AnzuApiResponseCodeError()
        }
        resolve(res.data)
      })
      .catch((err) => {
        if (isValidationError(err)) {
          handleValidationError(err, SYSTEM_CORE_DAM, ENTITY)
          reject(new AnzuApiValidationError())
        }
        reject(err)
      })
  })
}
