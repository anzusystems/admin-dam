import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'
import { type AclValue } from '@anzusystems/common-admin'
import { useAuth } from '@/domains/system/auth/auth'
import { isLogType, LogTypeDefault } from '@anzusystems/common-admin/labs'

export const checkAbility = async (to: RouteLocationNormalized): Promise<NavigationGuardReturn> => {
  const superAdminResult = checkSuperAdmin(to)
  if (isDefined(superAdminResult)) {
    return superAdminResult
  }

  const { canForAll } = useAuth()
  if (
    isUndefined(to.meta.requiredPermissions) ||
    (isArray<AclValue>(to.meta.requiredPermissions) && to.meta.requiredPermissions.length === 0)
  ) {
    return
  } else if (canForAll(to.meta.requiredPermissions)) {
    return
  } else {
    // todo show error?
    return '/unauthorized'
  }
}

/**
 * Logs are gated on being that system's superadmin, not on a permission.
 *
 * The `:type` segment is validated first, so a typo reads as a typo rather than as a refusal --
 * and so nothing indexes `logPaths` with a string that is not a log type. Correcting it goes back
 * to the listing and drops any `:id`: an id belongs to the store it came from.
 */
const checkSuperAdmin = (to: RouteLocationNormalized): NavigationGuardReturn | undefined => {
  const system = to.meta.superAdminOf as string | undefined
  if (isUndefined(system)) {
    return undefined
  }

  const type = (to.params as Record<string, string | string[] | undefined>).type
  if (isDefined(type) && !isLogType(type)) {
    // `replace`, not a push: the browser has already committed the bad url by the time the guard
    // sees it, so a push would leave it in history and Back would bounce straight back here.
    return { path: `/logs/dam/${LogTypeDefault}`, replace: true }
  }

  const { useCurrentUser } = useAuth()

  return useCurrentUser(system).isSuperAdmin.value ? undefined : '/unauthorized'
}
