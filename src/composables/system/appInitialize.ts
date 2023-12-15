import { useCookies } from '@vueuse/integrations/useCookies'
import { ref } from 'vue'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import {
  isDefined,
  isUndefined,
  updateDamCurrentUser,
  useDamConfigState,
  useDamCurrentUser,
} from '@anzusystems/common-admin'
import { ROUTE } from '@/router/routes'
import { checkAbility } from '@/router/checkAbility'
import { envConfig } from '@/services/EnvConfigService'
import { initCurrentExtSystemAndLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { initAppNotificationListeners } from '@/composables/system/appNotificationListeners'
import { useLoginStatus } from '@/composables/system/loginStatus'
import { damClient } from '@/services/api/clients/damClient'

const initialized = ref(false)

export async function createAppInitialize(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const { isStatusNotDefined, isStatusSsoCommunicationFailure, isStatusInternalErrorFailure, isStatusUnauthorized } =
    useLoginStatus(to)
  const { loadDamPrvConfig, loadDamConfigExtSystem, loadDamConfigAssetCustomFormElements } =
    useDamConfigState(damClient)

  try {
    const updateCurrentUserPromise = updateDamCurrentUser(damClient)
    const loadDamConfigPromise = loadDamPrvConfig()
    await Promise.all([updateCurrentUserPromise, loadDamConfigPromise])
  } catch (error) {
    next({ name: ROUTE.SYSTEM.LOGIN })
    return
  }
  try {
    await initCurrentExtSystemAndLicence(to.name === ROUTE.DAM.ASSET.DETAIL, to.params.id as string | undefined)
  } catch (error) {
    next({ name: ROUTE.SYSTEM.LOGIN })
    return
  }

  try {
    const { currentExtSystemId } = useCurrentExtSystem()

    const loadDamConfigExtSystemPromise = loadDamConfigExtSystem(currentExtSystemId.value)
    const loadDamConfigAssetCustomFormElementsPromise = loadDamConfigAssetCustomFormElements(currentExtSystemId.value)
    await Promise.all([loadDamConfigExtSystemPromise, loadDamConfigAssetCustomFormElementsPromise])
    initAppNotificationListeners()
  } catch (error) {
    next({ name: ROUTE.SYSTEM.LOGIN })
    return
  }

  const { damCurrentUser } = useDamCurrentUser()

  if (
    (isStatusNotDefined() || isStatusSsoCommunicationFailure() || isStatusInternalErrorFailure()) &&
    isUndefined(damCurrentUser.value)
  ) {
    next({ name: ROUTE.SYSTEM.LOGIN })
  } else if (isStatusUnauthorized()) {
    next({ name: ROUTE.SYSTEM.UNAUTHORIZED })
  } else if (to.path === '/') {
    initialized.value = true
    next({ name: ROUTE.DEFAULT })
  } else {
    initialized.value = true
    await checkAbility(to, from, next)
  }
}

export function useAppInitialize() {
  const cookies = useCookies([envConfig.cookies.refreshTokenExistsName, envConfig.cookies.jwtPayloadName])

  const hasAppAuthCookie = () => {
    const refreshTokenExistsCookie = cookies.get(envConfig.cookies.refreshTokenExistsName)
    const jwtPayloadCookie = cookies.get(envConfig.cookies.jwtPayloadName)

    return isDefined(refreshTokenExistsCookie) || isDefined(jwtPayloadCookie)
  }
  const isAppInitialized = () => initialized.value

  return {
    isAppInitialized,
    hasAppAuthCookie,
  }
}
