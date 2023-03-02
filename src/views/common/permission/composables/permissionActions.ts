import type { Permissions } from '@/types/Permission'
import type { AnzuUser, IntegerId } from '@anzusystems/common-admin'
import { isUndefined, objectGetValueByPath, objectSetValueByPath } from '@anzusystems/common-admin'
import { useLazyPermissionGroup } from '@/views/common/permissionGroup/composables/lazyPermissionGroup'

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
        const grant = objectGetValueByPath(permissionGroup.permissions, permissionName)
        if (!Object.hasOwn(permissions, permissionName)) {
          objectSetValueByPath(permissions, permissionName, grant)
          continue
        }
        if (objectGetValueByPath(permissions, permissionName) < grant) {
          objectSetValueByPath(permissions, permissionName, grant)
        }
      }
    }
    return permissions
  }

  return {
    resolvePermissions,
  }
}
