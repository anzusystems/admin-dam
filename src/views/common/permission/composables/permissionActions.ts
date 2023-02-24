import type { Permissions } from '@/types/Permission'
import { getObjectValueByPath, setObjectValueByPath } from '@anzusystems/common-admin'
import type { IntegerId } from '@anzusystems/common-admin'
import { isUndefined } from '@anzusystems/common-admin'
import { useLazyPermissionGroup } from '@/views/common/permissionGroup/composables/lazyPermissionGroup'
import type { AnzuUser } from '@anzusystems/common-admin'

export const usePermissionActions = () => {
  const { get } = useLazyPermissionGroup()
  const resolvePermissions = (user: AnzuUser): Permissions => {
    return {
      ...resolveGroupPermissions(user.permissionGroups),
      ...user.permissions,
    }
  }

  const resolveGroupPermissions = (permissionGroupIDs: IntegerId[]): Permissions => {
    const permissions: Permissions = {}
    const permissionGroups = permissionGroupIDs.map((permissionGroupId) => get(permissionGroupId))

    for (const permissionGroup of permissionGroups) {
      if (isUndefined(permissionGroup)) continue
      for (const permissionName in permissionGroup.permissions) {
        const grant = getObjectValueByPath(permissionGroup.permissions, permissionName)
        if (!Object.hasOwn(permissions, permissionName)) {
          setObjectValueByPath(permissions, permissionName, grant)
          continue
        }
        if (getObjectValueByPath(permissions, permissionName) < grant) {
          setObjectValueByPath(permissions, permissionName, grant)
        }
      }
    }
    return permissions
  }

  return {
    resolvePermissions,
  }
}
