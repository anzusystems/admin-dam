import type { Permissions } from '@/shared/types/Permission'
import type { AnzuUser } from '@anzusystems/common-admin'
import { objectGetValueByPath, objectSetValueByPath } from '@anzusystems/common-admin'
import { useCachedPermissionGroups } from '@/domains/common/permissionGroup/composables/cachedPermissionGroups'

export const usePermissionActions = () => {
  const { getCachedPermissionGroup } = useCachedPermissionGroups()
  const resolvePermissions = (user: AnzuUser): Permissions => {
    return {
      ...resolveGroupPermissions(user.permissionGroups),
      ...user.permissions,
    }
  }

  const resolveGroupPermissions = (permissionGroupIDs: IntegerId[]): Permissions => {
    const permissions: Permissions = {}
    const permissionGroups = permissionGroupIDs.map((permissionGroupId) => getCachedPermissionGroup(permissionGroupId))

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
