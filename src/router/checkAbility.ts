import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { isUndefined, useAcl } from '@anzusystems/common-admin'
import type { AclValue } from '@/types/Permission'
import { useCurrentUser } from '@/composables/system/currentUser'

export const checkAbility = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const { currentUser } = useCurrentUser()
  const { canForAll } = useAcl<AclValue>({ currentUser, disableInject: true })

  if (isUndefined(to.meta.requiredPermissions)) {
    next()
  } else if (canForAll(to.meta.requiredPermissions)) {
    next()
  } else {
    // todo show error?
    next({ name: 'unauthorized' })
  }
}
