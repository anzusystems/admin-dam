import type { PermissionGroup } from '@anzusystems/common-admin'
import { useApiFetchByIds, useApiFetchList } from '@anzusystems/common-admin'

import { damClient } from '@/shared/apiClients/damClient'

const SYSTEM = 'common'
export const ENTITY = 'permissionGroup'

const END_POINT = '/adm/v1/permission-group'

export const useFetchPermissionGroupList = () =>
  useApiFetchList<PermissionGroup>({
    client: damClient,
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })

export const useFetchPermissionGroupListByIds = () =>
  useApiFetchByIds<PermissionGroup>({
    client: damClient,
    system: SYSTEM,
    entity: ENTITY,
    urlTemplate: END_POINT,
  })
