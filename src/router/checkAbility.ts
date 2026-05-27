import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'
import { type AclValue, isArray, isUndefined } from '@anzusystems/common-admin'
import { useAuth } from '@/composables/auth/auth'

export const checkAbility = async (
  to: RouteLocationNormalized
): Promise<NavigationGuardReturn> => {
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
