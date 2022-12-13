import { useCookies } from '@vueuse/integrations/useCookies'
import { ref } from 'vue'
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { updateCurrentUser, useCurrentUser } from '@/composables/system/currentUser'
import { ROUTE } from '@/router/routes'
import { checkAbility } from '@/router/checkAbility'
import { isNotUndefined } from '@/utils/common'
import { loadDamConfig } from '@/services/DamConfigService'
import { envConfig } from '@/services/EnvConfigService'
import { initCurrentAssetLicence } from '@/composables/system/currentLicence'
import { initCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { loadDamConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { loadDamConfigAssetCustomFormElements } from '@/services/DamConfigAssetCustomFormService'
import { initAppNotificationListeners } from '@/composables/system/appNotificationListeners'

const initialized = ref<boolean>(false)

export async function createAppInitialize(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  try {
    await updateCurrentUser()
    await loadDamConfig()
    await loadDamConfigExtSystem()
    await initCurrentAssetLicence()
    await initCurrentExtSystem()
    await loadDamConfigAssetCustomFormElements()
    initAppNotificationListeners()
  } catch (error) {
    next({ name: ROUTE.SYSTEM.LOGIN })
    return
  }

  const { hasCurrentUser } = useCurrentUser()

  if (!hasCurrentUser()) {
    next({ name: ROUTE.SYSTEM.LOGIN })
  } else if (to.path === '/') {
    // todo load homepage config set by user
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

    return isNotUndefined(refreshTokenExistsCookie) || isNotUndefined(jwtPayloadCookie)
  }
  const isAppInitialized = () => initialized.value

  return {
    isAppInitialized,
    hasAppAuthCookie,
  }
}
