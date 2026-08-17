import { createAppInitialize, useAppInitialize } from '@/domains/system/composables/appInitialize'
import { initLanguageMessagesLoaded, initLoadLanguageMessages } from '@/loadLanguageMessages'
import { checkAbility } from '@/router/checkAbility'
import { damClient } from '@/shared/apiClients/damClient'
import { useDamConfigState, useDamConfigStore } from '@anzusystems/common-admin'
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

export const beforeEachRoute = async (to: RouteLocationNormalized): Promise<NavigationGuardReturn> => {
  const { loadDamPubConfig } = useDamConfigState(damClient)
  const damConfigStore = useDamConfigStore()
  const { initialized } = storeToRefs(damConfigStore)

  if (!initLanguageMessagesLoaded.value) await initLoadLanguageMessages()
  if (!initialized.value.damPubConfig) await loadDamPubConfig()
  if (to.meta.requiresAuth) {
    return await checkGuard(to)
  }
}

const checkGuard = async (to: RouteLocationNormalized): Promise<NavigationGuardReturn> => {
  const { isAppInitialized, hasAppAuthCookie } = useAppInitialize()
  if (isAppInitialized()) {
    return await checkAbility(to)
  } else if (hasAppAuthCookie()) {
    return await createAppInitialize(to)
  } else {
    return '/login'
  }
}
