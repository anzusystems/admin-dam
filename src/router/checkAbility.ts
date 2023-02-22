import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { isUndefined } from '@/utils/common'
import type { AclValue } from '@/types/Permission'
import { useAcl } from '@anzusystems/common-admin'

export const checkAbility = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const { canForAll } = useAcl<AclValue>()

  if (isUndefined(to.meta.requiredPermissions)) {
    next()
  } else if (canForAll(to.meta.requiredPermissions as AclValue[])) {
    next()
  } else {
    // todo show error?
    next({ name: 'unauthorized' })
  }
}
