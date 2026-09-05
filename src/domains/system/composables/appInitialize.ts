import { useAuth } from '@/domains/system/auth/auth'
import { initAppNotificationListeners } from '@/domains/system/composables/appNotificationListeners'
import {
  initCurrentExtSystemAndLicence,
  useCurrentExtSystem,
} from '@/domains/coreDam/asset/composables/currentExtSystem'
import { useLoginStatus } from '@/domains/system/composables/loginStatus'
import { SYSTEM_DAM } from '@/shared/systems'
import { checkAbility } from '@/router/checkAbility'
import { damClient } from '@/shared/apiClients/damClient'
import { DamAssetType, type DamAssetTypeType, useDamConfigState } from '@anzusystems/common-admin'
import { getAuthCookieState } from '@/shared/apiClients/authCookies'
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
  }

  // Only once this function is committed to succeeding — a bail-out above leaves `initialized`
  // false and the next navigation would re-register. Notifications are optional, so the catch is
  // required: `checkGuard` has none, and a malformed webSocketUrl throws synchronously and would
  // then block every protected navigation.
  try {
    initAppNotificationListeners()
  } catch (error) {
    console.error('appInitialize: notification listeners failed to start', error)
  }
  initialized.value = true

  if (to.path === '/') {
    return { name: '/(coreDam)/assets' }
  }

  return await checkAbility(to)
}

export function useAppInitialize() {
  const hasAppAuthCookie = () => {
    const { refreshTokenExists, jwtPayload } = getAuthCookieState()

    return isDefined(refreshTokenExists) || isDefined(jwtPayload)
  }
  const isAppInitialized = () => initialized.value

  return {
    isAppInitialized,
    hasAppAuthCookie,
  }
}

function getInitCurrentExtSystemAndLicenceConfig(to: RouteLocationNormalized, id: string | undefined) {
  if (to.name === '/(coreDam)/assets/[id]') {
    return {
      type: 'assetId' as const,
      id,
    }
  }
  if (to.name === '/(coreDam)/assets/file/[id]') {
    return {
      type: 'assetFileId' as const,
      id,
    }
  }
  return undefined
}
