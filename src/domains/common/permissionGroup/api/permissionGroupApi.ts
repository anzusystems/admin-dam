import type { PermissionGroup } from '@anzusystems/common-admin'
import { useApiFetchByIds, useApiFetchList, useApiRequest } from '@anzusystems/common-admin/labs'
import { damClient } from '@/shared/apiClients/damClient'

const SYSTEM = 'common'
export const ENTITY = 'permissionGroup'

const END_POINT = '/adm/v1/permission-group'

export const useFetchPermissionGroupList = () =>
  useApiFetchList<PermissionGroup[]>({
    client: damClient,
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useFetchPermissionGroupListByIds = () =>
  useApiFetchByIds<PermissionGroup[]>({
    client: damClient,
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useFetchPermissionGroup = () =>
  useApiRequest<PermissionGroup, null>({
    client: damClient,
    method: 'GET',
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useCreatePermissionGroup = () =>
  useApiRequest<PermissionGroup, PermissionGroup>({
    client: damClient,
    method: 'POST',
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useUpdatePermissionGroup = () =>
  useApiRequest<PermissionGroup, PermissionGroup>({
    client: damClient,
    method: 'PUT',
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })

export const useDeletePermissionGroup = () =>
  useApiRequest<void, null>({
    client: damClient,
    method: 'DELETE',
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT + '/:id',
  })
