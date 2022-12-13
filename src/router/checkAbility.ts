import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAcl } from '@/composables/system/ability'
import { isUndefined } from '@/utils/common'
import type { AclValue } from '@/types/Permission'

export const checkAbility = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const { canForAll } = useAcl()

  if (isUndefined(to.meta.requiredPermissions)) {
    next()
  } else if (canForAll(to.meta.requiredPermissions as AclValue[])) {
    next()
  } else {
    // todo show error?
    next({ name: 'unauthorized' })
  }
}
