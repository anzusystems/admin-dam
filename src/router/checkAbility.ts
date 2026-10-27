import { LogTypeDefault, isArray, isDefined, isLogType, isUndefined } from '@anzusystems/common-admin'
import type { AclValue } from '@anzusystems/common-admin'
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

import { useAuth } from '@/domains/system/auth/auth'

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
 * Logs require being that system's superadmin, not a permission.
 * `:type` is validated first, so a typo shows as a typo, not a
 * refusal, and `logPaths` is never indexed with a non-log type.
 * The correction goes to the listing and drops any `:id`, because an id belongs to its own store.
 */
const checkSuperAdmin = (to: RouteLocationNormalized): NavigationGuardReturn | undefined => {
  const system = to.meta.superAdminOf as string | undefined
  if (isUndefined(system)) {
    return undefined
  }

  const type = (to.params as Record<string, string | string[] | undefined>).type
  if (isDefined(type) && !isLogType(type)) {
    // `replace`, not push. The browser has already committed the bad url,
    // so a push would keep it in history and Back would return here.
    return { path: `/logs/dam/${LogTypeDefault}`, replace: true }
  }

  const { useCurrentUser } = useAuth()

  return useCurrentUser(system).isSuperAdmin.value ? undefined : '/unauthorized'
}
