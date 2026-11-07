import {
  AuthUnavailableError,
  DamAssetType,
  isAnzuApiTimeoutError,
  isDefined,
  isInCauseChain,
  isUndefined,
  useDamConfigState,
} from '@anzusystems/common-admin'
import type { DamAssetTypeType, DamCurrentUserDto, IntegerId } from '@anzusystems/common-admin'
import axios from 'axios'
import { readonly, ref } from 'vue'
import type { NavigationGuardReturn, RouteLocationNormalized } from 'vue-router'

import {
  initCurrentExtSystemAndLicence,
  useCurrentExtSystem,
} from '@/domains/coreDam/asset/composables/currentExtSystem'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { initAppNotificationListeners } from '@/domains/system/composables/appNotificationListeners'
import { useLoginStatus } from '@/domains/system/composables/loginStatus'
import { checkAbility } from '@/router/checkAbility'
import { getAuthCookieState } from '@/shared/apiClients/authCookies'
import { damClient } from '@/shared/apiClients/damClient'
import { SYSTEM_DAM } from '@/shared/systems'

const initialized = ref(false)
// Ext system the start-up stopped on for lack of access. The error page shows a specific message for it.
const accessDeniedExtSystemId = ref<IntegerId | undefined>(undefined)

// A start-up that could not complete, for an unknown reason.
const ERROR_PATH = '/error'
// A deep link that could not be resolved to an asset. Other failures go to `ERROR_PATH`.
const NOT_FOUND_PATH = '/not-found'

// Nothing answered the user read: neither the sign-in server (token refresh) nor core-dam.
// The session may be valid, and the sign-in form would hit the same failure after the SSO round trip.
const isOutage = (error: unknown): boolean =>
  isInCauseChain(
    error,
    (cause) =>
      cause instanceof AuthUnavailableError ||
      isAnzuApiTimeoutError(cause) ||
      (axios.isAxiosError(cause) && (isUndefined(cause.response) || cause.response.status >= 500))
  )

/*
 * The ext system config and its custom form elements are readable only by an admin or a user of that ext system.
 * Their loaders reject with a bare `false`, so a 403 is not detectable. A missing permission here implies it was one.
 */
const lacksExtSystemAccess = (extSystemId: IntegerId): boolean => {
  const { canSafe, useCurrentUser } = useAuth()
  const { currentUser, isSuperAdmin } = useCurrentUser<DamCurrentUserDto>(SYSTEM_DAM)
  if (isSuperAdmin.value) return false
  const user = currentUser.value
  if (!user || !(user.adminToExtSystems.includes(extSystemId) || user.userToExtSystems.includes(extSystemId))) {
    return true
  }

  return !canSafe([ACL.DAM_EXT_SYSTEM_READ, ACL.DAM_CUSTOM_FORM_ELEMENT_READ, ACL.DAM_ASSET_CUSTOM_FORM_READ])
}

export async function createAppInitialize(to: RouteLocationNormalized): Promise<NavigationGuardReturn> {
  const { isStatusUnauthorized } = useLoginStatus(to)
  const { loadDamPrvConfig, loadDamConfigExtSystem, loadDamConfigAssetCustomFormElements, getDamConfigExtSystem } =
    useDamConfigState(damClient)
  const { useCurrentUser } = useAuth()
  const { fetchCurrentUser } = useCurrentUser(SYSTEM_DAM)
  accessDeniedExtSystemId.value = undefined

  /*
   * Checked before fetching: the private config is protected, so it most likely fails for a user the SSO just refused.
   */
  if (isStatusUnauthorized()) {
    return '/unauthorized'
  }

  /*
   * Settled, not raced: `Promise.all` left the user answer unread.
   * Only a successful user load rules out a sign-in problem. `loadDamPrvConfig`
   * rejects with a bare `false`, and a failed user read is inconclusive.
   */
  const [userLoad, configLoad] = await Promise.allSettled([
    fetchCurrentUser(damClient, '/adm/users/current', undefined, 'user', { throwOnError: true }),
    loadDamPrvConfig(),
  ])

  /*
   * Use this attempt's result, not the ref: a failed read keeps the previous user.
   * A bailed-out start-up reruns on the next navigation.
   */
  if (userLoad.status === 'rejected' && isOutage(userLoad.reason)) {
    return ERROR_PATH
  }
  if (userLoad.status === 'rejected' || isUndefined(userLoad.value)) {
    return '/login'
  }
  if (configLoad.status === 'rejected') {
    // The user is readable, so this is not an outage. The rejection does not say what it is.
    console.error('appInitialize: private configuration failed to load', configLoad.reason)

    return ERROR_PATH
  }

  const extSystemConfig = getInitCurrentExtSystemAndLicenceConfig(to, (to.params as { id?: string }).id)
  let extSystemResolved = false
  try {
    extSystemResolved = await initCurrentExtSystemAndLicence(extSystemConfig)
  } catch (error) {
    return ERROR_PATH
  }
  if (!extSystemResolved) {
    // It returns `false` instead of throwing. Ignoring that continued with ext system `0`.
    return isUndefined(extSystemConfig) ? ERROR_PATH : NOT_FOUND_PATH
  }

  const { currentExtSystemId } = useCurrentExtSystem()
  try {
    await loadDamConfigExtSystem(currentExtSystemId.value)
    const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
    if (isUndefined(configExtSystem)) {
      return ERROR_PATH
    }
    const enabledAssetTypes: DamAssetTypeType[] = []
    if (configExtSystem.audio?.enabled) enabledAssetTypes.push(DamAssetType.Audio)
    if (configExtSystem.video?.enabled) enabledAssetTypes.push(DamAssetType.Video)
    if (configExtSystem.image?.enabled) enabledAssetTypes.push(DamAssetType.Image)
    if (configExtSystem.document?.enabled) enabledAssetTypes.push(DamAssetType.Document)
    await loadDamConfigAssetCustomFormElements(currentExtSystemId.value, enabledAssetTypes)
  } catch (error) {
    if (lacksExtSystemAccess(currentExtSystemId.value)) {
      accessDeniedExtSystemId.value = currentExtSystemId.value
    }

    return ERROR_PATH
  }

  /*
   * Only once start-up will succeed: a bail-out leaves `initialized`
   * false and the next navigation would register again.
   * Notifications are optional. A malformed `webSocketUrl` throws
   * synchronously and must not block protected navigation.
   */
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
    accessDeniedExtSystemId: readonly(accessDeniedExtSystemId),
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
