import { useAuth } from '@/composables/auth/auth'
import { initAppNotificationListeners } from '@/composables/system/appNotificationListeners'
import { initCurrentExtSystemAndLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useLoginStatus } from '@/composables/system/loginStatus'
import { SYSTEM_DAM } from '@/model/systems'
import { checkAbility } from '@/router/checkAbility'
import { ROUTE } from '@/router/routes'
import { damClient } from '@/services/api/clients/damClient'
import { envConfig } from '@/services/EnvConfigService'
import { isDefined, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { useCookies } from '@vueuse/integrations/useCookies'
import { ref } from 'vue'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'

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
  const { useCurrentUser } = useAuth()
  const { fetchCurrentUser, currentUser } = useCurrentUser(SYSTEM_DAM)

  try {
    const updateCurrentUserPromise = fetchCurrentUser(damClient, '/adm/users/current')
    const loadDamConfigPromise = loadDamPrvConfig()
    await Promise.allSettled([updateCurrentUserPromise, loadDamConfigPromise])
  } catch (error) {
    next({ name: ROUTE.SYSTEM.LOGIN })
    return
  }
  try {
    await initCurrentExtSystemAndLicence(
      getInitCurrentExtSystemAndLicenceConfig(to, to.params.id as string | undefined)
    )
  } catch (error) {
    next({ name: ROUTE.SYSTEM.LOGIN })
    return
  }

  try {
    const { currentExtSystemId } = useCurrentExtSystem()

    const loadDamConfigExtSystemPromise = loadDamConfigExtSystem(currentExtSystemId.value)
    const loadDamConfigAssetCustomFormElementsPromise = loadDamConfigAssetCustomFormElements(currentExtSystemId.value)
    await Promise.allSettled([loadDamConfigExtSystemPromise, loadDamConfigAssetCustomFormElementsPromise])
    initAppNotificationListeners()
  } catch (error) {
    next({ name: ROUTE.SYSTEM.LOGIN })
    return
  }

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

function getInitCurrentExtSystemAndLicenceConfig(to: RouteLocationNormalized, id: string | undefined) {
  if (to.name === ROUTE.DAM.ASSET.DETAIL) {
    return {
      type: 'assetId' as const,
      id,
    }
  }
  if (to.name === ROUTE.DAM.ASSET.FILE_DETAIL) {
    return {
      type: 'assetFileId' as const,
      id,
    }
  }
  return undefined
}
