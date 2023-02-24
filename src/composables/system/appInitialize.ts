import { useCookies } from '@vueuse/integrations/useCookies'
import { ref } from 'vue'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { updateCurrentUser, useCurrentUser } from '@/composables/system/currentUser'
import { ROUTE } from '@/router/routes'
import { checkAbility } from '@/router/checkAbility'
import { isDefined } from '@anzusystems/common-admin'
import { loadDamConfig } from '@/services/DamConfigService'
import { envConfig } from '@/services/EnvConfigService'
import { initCurrentExtSystemAndLicence } from '@/composables/system/currentExtSystem'
import { loadDamConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { loadDamConfigAssetCustomFormElements } from '@/services/DamConfigAssetCustomFormService'
import { initAppNotificationListeners } from '@/composables/system/appNotificationListeners'
import { useLoginStatus } from '@/composables/system/loginStatus'
import { isUndefined } from '@anzusystems/common-admin'

const initialized = ref<boolean>(false)

export async function createAppInitialize(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const { isStatusNotDefined, isStatusSsoCommunicationFailure, isStatusInternalErrorFailure, isStatusUnauthorized } =
    useLoginStatus(to)

  try {
    const updateCurrentUserPromise = updateCurrentUser()
    const loadDamConfigPromise = loadDamConfig()
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
    const loadDamConfigExtSystemPromise = loadDamConfigExtSystem()
    const loadDamConfigAssetCustomFormElementsPromise = loadDamConfigAssetCustomFormElements()
    await Promise.all([loadDamConfigExtSystemPromise, loadDamConfigAssetCustomFormElementsPromise])
    initAppNotificationListeners()
  } catch (error) {
    next({ name: ROUTE.SYSTEM.LOGIN })
    return
  }

  const { currentUser } = useCurrentUser()

  if (
    (isStatusNotDefined() || isStatusSsoCommunicationFailure() || isStatusInternalErrorFailure()) &&
    isUndefined(currentUser.value)
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
