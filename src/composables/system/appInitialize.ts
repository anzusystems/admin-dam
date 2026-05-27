import { useAuth } from '@/composables/auth/auth'
import { initAppNotificationListeners } from '@/composables/system/appNotificationListeners'
import { initCurrentExtSystemAndLicence, useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { useLoginStatus } from '@/composables/system/loginStatus'
import { SYSTEM_DAM } from '@/model/systems'
import { checkAbility } from '@/router/checkAbility'
import { damClient } from '@/services/api/clients/damClient'
import { envConfig } from '@/services/EnvConfigService'
import { DamAssetType, type DamAssetTypeType, useDamConfigState } from '@anzusystems/common-admin'
import { useCookies } from '@vueuse/integrations/useCookies'
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

const initialized = ref(false)

export async function createAppInitialize(to: RouteLocationNormalized): Promise<NavigationGuardReturn> {
  const { isStatusNotDefined, isStatusSsoCommunicationFailure, isStatusInternalErrorFailure, isStatusUnauthorized } =
    useLoginStatus(to)
  const { loadDamPrvConfig, loadDamConfigExtSystem, loadDamConfigAssetCustomFormElements, getDamConfigExtSystem } =
    useDamConfigState(damClient)
  const { useCurrentUser } = useAuth()
  const { fetchCurrentUser, currentUser } = useCurrentUser(SYSTEM_DAM)

  try {
    const updateCurrentUserPromise = fetchCurrentUser(damClient, '/adm/users/current')
    const loadDamConfigPromise = loadDamPrvConfig()
    await Promise.all([updateCurrentUserPromise, loadDamConfigPromise])
  } catch (error) {
    return '/login'
  }
  try {
    await initCurrentExtSystemAndLicence(getInitCurrentExtSystemAndLicenceConfig(to, (to.params as { id?: string }).id))
  } catch (error) {
    return '/login'
  }

  try {
    const { currentExtSystemId } = useCurrentExtSystem()
    await loadDamConfigExtSystem(currentExtSystemId.value)
    const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
    if (isUndefined(configExtSystem)) {
      return '/login'
    }
    const enabledAssetTypes: DamAssetTypeType[] = []
    if (configExtSystem.audio?.enabled) enabledAssetTypes.push(DamAssetType.Audio)
    if (configExtSystem.video?.enabled) enabledAssetTypes.push(DamAssetType.Video)
    if (configExtSystem.image?.enabled) enabledAssetTypes.push(DamAssetType.Image)
    if (configExtSystem.document?.enabled) enabledAssetTypes.push(DamAssetType.Document)
    await loadDamConfigAssetCustomFormElements(currentExtSystemId.value, enabledAssetTypes)
    initAppNotificationListeners()
  } catch (error) {
    return '/login'
  }

  if (
    (isStatusNotDefined() || isStatusSsoCommunicationFailure() || isStatusInternalErrorFailure()) &&
    isUndefined(currentUser.value)
  ) {
    return '/login'
  } else if (isStatusUnauthorized()) {
    return '/unauthorized'
  } else if (to.path === '/') {
    initialized.value = true
    return { name: '/(coreDam)/asset' }
  } else {
    initialized.value = true
    return await checkAbility(to)
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
  if (to.name === '/(coreDam)/asset/[id]') {
    return {
      type: 'assetId' as const,
      id,
    }
  }
  if (to.name === '/(coreDam)/asset/file/[id]') {
    return {
      type: 'assetFileId' as const,
      id,
    }
  }
  return undefined
}
