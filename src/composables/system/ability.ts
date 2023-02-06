import { isUndefined } from '@/utils/common'
import type { AclValue } from '@/types/Permission'
import { useCurrentUser } from '@/composables/system/currentUser'
import { getValueByPath, Grant, isCreatedByAware, isOwnerAware } from '@anzusystems/common-admin'

export const ROLE_ADMIN = 'ROLE_ADMIN'

export function useAcl() {
  const { currentUserIsSuperAdmin, hasCurrentUser, currentUser } = useCurrentUser()

  const can = (acl: AclValue, subject?: object): boolean => {
    if (!hasCurrentUser()) return false
    if (currentUserIsSuperAdmin.value) return true
    const permission = getValueByPath(currentUser.value, 'resolvedPermissions.' + acl)
    if (isUndefined(permission)) return false
    switch (permission) {
      case Grant.Allow:
        return true
      case Grant.Deny:
        return false
      case Grant.AllowOwner:
        if (isUndefined(subject))
          throw new Error(`Required subject for acl "${acl}" to determine an ability to access the resource.`)
        return canOwner(subject)
      default:
        return false
    }
  }

  function canOwner(subject: object) {
    if (currentUser.value) {
      if (isOwnerAware(subject)) {
        return subject.owners.includes(currentUser.value.id)
      }
      if (isCreatedByAware(subject)) {
        return subject.createdBy === currentUser.value.id
      }
    }
    return false
  }

  const canForAll = (acls: AclValue[], subject?: object): boolean => {
    if (acls.length === 0) {
      return true
    }
    return acls.every((acl) => {
      return can(acl, subject)
    })
  }

  const canForSome = (acls: AclValue[], subject?: object): boolean => {
    if (acls.length === 0) {
      return true
    }
    return acls.some((acl) => {
      return can(acl, subject)
    })
  }

  const hasSuperAdminRole = (roles: string[] = []): boolean => roles.includes(ROLE_ADMIN)

  return {
    can,
    canForAll,
    canForSome,
    hasSuperAdminRole,
  }
}
