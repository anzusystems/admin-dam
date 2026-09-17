import { createAppInitialize, useAppInitialize } from '@/domains/system/composables/appInitialize'
import { initLanguageMessagesLoaded, initLoadLanguageMessages } from '@/loadLanguageMessages'
import { checkForNewVersion } from '@/router/checkNewVersion'
import { RELOAD_VETO_GRACE } from '@/appReload'
import { checkAbility } from '@/router/checkAbility'
import { damClient } from '@/shared/apiClients/damClient'
import { useDamConfigState, useDamConfigStore, useRouteHistory } from '@anzusystems/common-admin'
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

const ERROR_PATH = '/error'

export const beforeEachRoute = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): Promise<NavigationGuardReturn> => {
  const { addRoute } = useRouteHistory()
  // the very first navigation comes from nowhere, and a nameless route is nothing to
  // hand back to anyway
  if (from.name) {
    addRoute(from)
  }

  const { loadDamPubConfig } = useDamConfigState(damClient)
  const { isAppInitialized } = useAppInitialize()
  const damConfigStore = useDamConfigStore()
  const { initialized } = storeToRefs(damConfigStore)

  // parked while the reload commits, aborted 3s later if a beforeunload veto kept us alive
  if (checkForNewVersion()) {
    return new Promise<NavigationGuardReturn>((resolve) => setTimeout(() => resolve(false), RELOAD_VETO_GRACE))
  }

  if (!initLanguageMessagesLoaded.value) await initLoadLanguageMessages()
  if (!initialized.value.damPubConfig) {
    try {
      await loadDamPubConfig()
    } catch (error) {
      /* Unhandled, this rejects the guard and the router has no `onError`: aborted navigation and a
       * blank page. Reachable at all because the library's `loadDamPrvConfig` clears this flag on
       * every start-up. */
      console.error('beforeEachRoute: public configuration failed to load', error)
      /* Only while there is nothing to lose: answering here at all skips the guard below, and once
       * the application is up a running upload queue is worth more than a full reload. */
      if (!isAppInitialized()) {
        return to.path === ERROR_PATH ? undefined : ERROR_PATH
      }
    }
  }
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
