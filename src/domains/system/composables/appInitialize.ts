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

// A start-up that could not be completed; nothing is known here about why.
const ERROR_PATH = '/error'
// A deep link that could not be resolved to an asset; anything else goes to the page above.
const NOT_FOUND_PATH = '/not-found'

export async function createAppInitialize(to: RouteLocationNormalized): Promise<NavigationGuardReturn> {
  const { isStatusUnauthorized } = useLoginStatus(to)
  const { loadDamPrvConfig, loadDamConfigExtSystem, loadDamConfigAssetCustomFormElements, getDamConfigExtSystem } =
    useDamConfigState(damClient)
  const { useCurrentUser } = useAuth()
  const { fetchCurrentUser } = useCurrentUser(SYSTEM_DAM)

  /* Before anything is fetched: the private config is protected, so for a user the SSO has just
   * refused it is the request most likely to fail, and it answered before this verdict was read. */
  if (isStatusUnauthorized()) {
    return '/unauthorized'
  }

  /* Settled, not raced: `Promise.all` left the current-user answer unread, and a user that does
   * load is the only thing here that rules out a sign-in problem - `loadDamPrvConfig` rejects with
   * a bare `false`, and a failed user read says nothing either way. */
  const [userLoad, configLoad] = await Promise.allSettled([
    fetchCurrentUser(damClient, '/adm/users/current'),
    loadDamPrvConfig(),
  ])

  /* What this attempt read, not what the ref holds: `fetchCurrentUser` answers `undefined` on every failure but
   * leaves the previous user in place, and a bailed-out start-up runs all of this again on the next navigation. */
  if (userLoad.status === 'rejected' || isUndefined(userLoad.value)) {
    return '/login'
  }
  if (configLoad.status === 'rejected') {
    // The user is readable, so not the case above; what it is instead the rejection does not say.
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
    // It answers `false` rather than throwing, and dropping that carried on with ext system `0`.
    return isUndefined(extSystemConfig) ? ERROR_PATH : NOT_FOUND_PATH
  }

  try {
    const { currentExtSystemId } = useCurrentExtSystem()
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
    return ERROR_PATH
  }

  /* Only once this is committed to succeeding: a bail-out above leaves `initialized` false and the
   * next navigation would re-register. Notifications are optional, so a malformed `webSocketUrl` -
   * which throws synchronously - must not block every protected navigation. */
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
