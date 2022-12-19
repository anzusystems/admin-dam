import { isNotUndefined, isUndefined } from '@/utils/common'
import { ACL, type AclValue, Grant } from '@/types/Permission'
import { useCurrentUser } from '@/composables/system/currentUser'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

const aclsNotAlwaysAllowedForExtSystemAdmin: AclValue[] = [
  ACL.DAM_EXT_SYSTEM_UPDATE,
  ACL.DAM_EXT_SYSTEM_VIEW,
  ACL.DAM_USER_VIEW,
  ACL.DAM_USER_CREATE,
  ACL.DAM_USER_UPDATE,
  ACL.DAM_ASSET_LICENCE_CREATE,
  ACL.DAM_ASSET_LICENCE_UPDATE,
  ACL.DAM_ASSET_LICENCE_VIEW,
  ACL.DAM_PERMISSION_GROUP_VIEW,
  ACL.DAM_PERMISSION_GROUP_CREATE,
  ACL.DAM_PERMISSION_GROUP_UPDATE,
  ACL.DAM_PERMISSION_GROUP_DELETE,
  ACL.DAM_EXT_SYSTEM_UI,
  ACL.DAM_USER_UI,
  ACL.DAM_PERMISSION_GROUP_UI,
  ACL.DAM_ASSET_LICENCE_UI,
  ACL.DAM_DISTRIBUTION_CATEGORY_UI,
  ACL.DAM_DISTRIBUTION_CATEGORY_SELECT_UI,
]

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function canOwner(acl: AclValue, subject: object) {
  // Example of permission resolver for owner
  // if (acl === 'dam_asset_view') {
  //   return subject.createdBy === currentUser
  // }
  return false
}

export function useAcl() {
  const { currentUserIsSuperAdmin, hasCurrentUser, currentUser } = useCurrentUser()
  const { currentExtSystemId } = useCurrentExtSystem()

  const can = (acl: AclValue, subject?: object): boolean => {
    if (!hasCurrentUser()) return false
    if (currentUserIsSuperAdmin.value) return true
    const permission = currentUser.value?.resolvedPermissions[acl]
    if (isUndefined(permission)) return false
    if (
      isNotUndefined(currentExtSystemId.value) &&
      !aclsNotAlwaysAllowedForExtSystemAdmin.includes(acl) &&
      currentUser.value?.adminToExtSystems.includes(currentExtSystemId.value)
    )
      return true
    switch (permission) {
      case Grant.Allow:
        return true
      case Grant.Deny:
        return false
      case Grant.AllowOwner:
        if (isUndefined(subject))
          throw new Error(`Required subject for acl "${acl}" to determine an ability to access the resource.`)
        return canOwner(acl, subject)
      default:
        return false
    }
  }

  const canForAll = (acls: AclValue[], subject?: object): boolean => {
    if (acls.length === 0) {
      return true
    }
    return acls.every((acl) => {
      return can(acl, subject)
    })
  }

  return {
    can,
    canForAll,
  }
}
