import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { createAppInitialize, useAppInitialize } from '@/composables/system/appInitialize'
import { ROUTE } from '@/router/routes'
import { checkAbility } from '@/router/checkAbility'
import { initLanguageMessagesLoaded, initLoadLanguageMessages } from '@/loadLanguageMessages'
import { useDamConfigState } from '@anzusystems/common-admin'

export const beforeEachRoute = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const { loadDamPubConfig, initialized } = useDamConfigState()

  if (!initLanguageMessagesLoaded.value) await initLoadLanguageMessages()
  if (!initialized.damPubConfig) await loadDamPubConfig()
  if (to.meta.requiresAuth) {
    await checkGuard(to, from, next)
  } else {
    next()
  }
}

const checkGuard = async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  const { isAppInitialized, hasAppAuthCookie } = useAppInitialize()
  if (isAppInitialized()) {
    await checkAbility(to, from, next)
  } else if (hasAppAuthCookie()) {
    await createAppInitialize(to, from, next)
  } else {
    next({ name: ROUTE.SYSTEM.LOGIN })
  }
}
