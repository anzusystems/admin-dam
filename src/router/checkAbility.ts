import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { isUndefined, useAcl, useDamCurrentUser } from '@anzusystems/common-admin'
import type { AclValue } from '@/types/Permission'

export const checkAbility = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const { damCurrentUser } = useDamCurrentUser()
  const { canForAll } = useAcl<AclValue>({ currentUser: damCurrentUser, disableInject: true })

  if (isUndefined(to.meta.requiredPermissions)) {
    next()
  } else if (canForAll(to.meta.requiredPermissions)) {
    next()
  } else {
    // todo show error?
    next({ name: 'unauthorized' })
  }
}
