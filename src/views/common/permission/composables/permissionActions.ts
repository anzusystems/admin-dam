import type { Permissions } from '@/types/Permission'
import { getValueByPath, setValueByPath } from '@/utils/object'
import type { IntegerId } from '@/types/common'
import { isUndefined } from '@/utils/common'
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
        const grant = getValueByPath(permissionGroup.permissions, permissionName)
        if (!Object.hasOwn(permissions, permissionName)) {
          setValueByPath(permissions, permissionName, grant)
          continue
        }
        if (getValueByPath(permissions, permissionName) < grant) {
          setValueByPath(permissions, permissionName, grant)
        }
      }
    }
    return permissions
  }

  return {
    resolvePermissions,
  }
}
