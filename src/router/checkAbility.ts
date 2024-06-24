import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { isUndefined } from '@anzusystems/common-admin'
import { useAuth } from '@/composables/auth/auth'

export const checkAbility = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const { canForAll } = useAuth()

  if (isUndefined(to.meta.requiredPermissions)) {
    next()
  } else if (canForAll(to.meta.requiredPermissions)) {
    next()
  } else {
    // todo show error?
    next({ name: 'unauthorized' })
  }
}
