import {
  RELOAD_VETO_GRACE,
  checkForNewVersion,
  isDefined,
  useDamConfigState,
  useDamConfigStore,
  useRouteHistory,
} from '@anzusystems/common-admin'
import { storeToRefs } from 'pinia'
import { START_LOCATION } from 'vue-router'
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

import { createAppInitialize, useAppInitialize } from '@/domains/system/composables/appInitialize'
import { initLanguageMessagesLoaded, initLoadLanguageMessages } from '@/loadLanguageMessages'
import { checkAbility } from '@/router/checkAbility'
import { ERROR_PAGE_PATH, errorPageFor, errorPageReturnPath, openAppPath, withReturnPath } from '@/router/errorPage'
import { damClient } from '@/shared/apiClients/damClient'

export const beforeEachRoute = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): Promise<NavigationGuardReturn> => {
  const { addRoute } = useRouteHistory()
  // The first navigation has no origin, and a nameless route cannot be returned to.
  if (from.name) {
    addRoute(from)
  }

  const { loadDamPubConfig } = useDamConfigState(damClient)
  const { isAppInitialized } = useAppInitialize()
  const damConfigStore = useDamConfigStore()
  const { initialized } = storeToRefs(damConfigStore)

  // Waits while the reload commits. Aborted after 3s if a beforeunload veto keeps the page alive.
  if (checkForNewVersion()) {
    return new Promise<NavigationGuardReturn>((resolve) => setTimeout(() => resolve(false), RELOAD_VETO_GRACE))
  }

  if (!initLanguageMessagesLoaded.value) await initLoadLanguageMessages()
  if (!initialized.value.damPubConfig) {
    try {
      await loadDamPubConfig()
    } catch (error) {
      /*
       * Unhandled, this rejects the guard: an aborted navigation, and a blank page on the first one.
       * It is reachable because the library's `loadDamPrvConfig` clears this flag on every start-up.
       */
      console.error('beforeEachRoute: public configuration failed to load', error)
      /*
       * Only before the app is initialized. Returning here skips the guard below.
       * Once the app is up, a running upload queue is worth more than a full reload.
       */
      if (!isAppInitialized()) {
        return to.path === ERROR_PAGE_PATH ? undefined : errorPageFor(to)
      }
    }
  }
  // A reload of the error page runs start-up again, like the page's button, for the page that failed to open.
  // The start-up's own redirect here has `redirectedFrom`, so a repeated failure stays on the page.
  if (to.path === ERROR_PAGE_PATH && from === START_LOCATION && !to.redirectedFrom) {
    const target = errorPageReturnPath(to.query)
    if (target === '/') return { path: '/' }
    openAppPath(target, { replace: true })
    return false
  }
  if (to.meta.requiresAuth) {
    return await checkGuard(to)
  }
}

const checkGuard = async (to: RouteLocationNormalized): Promise<NavigationGuardReturn> => {
  const { isAppInitialized, hasAppAuthCookie, accessDeniedExtSystemId } = useAppInitialize()
  if (isAppInitialized()) {
    return await checkAbility(to)
  } else if (hasAppAuthCookie()) {
    const result = await createAppInitialize(to)
    // A retry of a link into an ext system the user may not read is refused again. The home page opens their own.
    return isDefined(accessDeniedExtSystemId.value) ? result : withReturnPath(result, to)
  } else {
    return '/login'
  }
}
