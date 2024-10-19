import { createAppInitialize, useAppInitialize } from '@/composables/system/appInitialize'
import { initLanguageMessagesLoaded, initLoadLanguageMessages } from '@/loadLanguageMessages'
import { checkAbility } from '@/router/checkAbility'
import { ROUTE } from '@/router/routes'
import { damClient } from '@/services/api/clients/damClient'
import { useDamConfigState, useDamConfigStore } from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

export const beforeEachRoute = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) => {
  const { loadDamPubConfig } = useDamConfigState(damClient)
  const damConfigStore = useDamConfigStore()
  const { initialized } = storeToRefs(damConfigStore)

  if (!initLanguageMessagesLoaded.value) await initLoadLanguageMessages()
  if (!initialized.value.damPubConfig) await loadDamPubConfig()
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
