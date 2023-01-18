import { readonly, ref, watch } from 'vue'
import { damConfig, damConfigInitialized } from '@/services/DamConfigService'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { fetchExtSystem } from '@/services/api/dam/extSystemApi'
import { useCurrentUser } from '@/composables/system/currentUser'
import { fetchAssetLicence } from '@/services/api/dam/assetLicenceApi'

const currentExtSystemId = ref(0)
const currentExtSystem = ref<ExtSystem>()

export const initCurrentExtSystem = () => {
  const { currentUser, currentUserIsSuperAdmin } = useCurrentUser()

  watch(currentExtSystemId, async (newValue, oldValue) => {
    if (newValue !== oldValue && newValue > 0) {
      currentExtSystem.value = undefined
      currentExtSystem.value = await fetchExtSystem(currentExtSystemId.value)
    }
  })

  return new Promise((resolve, reject) => {
    if (!damConfigInitialized.value) {
      console.error('Config must be loaded first.')
      reject(false)
      return
    }
    if (!currentUser.value) {
      console.error('Current user must be loaded first.')
      reject(false)
      return
    }
    if (damConfig.settings.allowSelectExtSystem) {
      if (currentUserIsSuperAdmin.value && currentUser.value.selectedLicence) {
        fetchAssetLicence(currentUser.value.selectedLicence.id).then((res) => {
          if (res.extSystem) {
            currentExtSystemId.value = res.extSystem
            resolve(true)
            return
          }
          currentExtSystemId.value = damConfig.settings.defaultExtSystemId
          resolve(true)
        })
      } else if (currentUser.value.selectedLicence) {
        const foundLicence = currentUser.value.assetLicences.find(
          (item) => item.id === currentUser.value!.selectedLicence!.id
        )
        if (foundLicence) {
          currentExtSystemId.value = foundLicence.extSystem
          resolve(true)
          return
        }
      } else if (currentUser.value.assetLicences[0]) {
        currentExtSystemId.value = currentUser.value.assetLicences[0].extSystem
        resolve(true)
        return
      }
    }
    currentExtSystemId.value = damConfig.settings.defaultExtSystemId
    resolve(true)
  })
}

export function useCurrentExtSystem() {
  return {
    currentExtSystemId: readonly(currentExtSystemId),
    currentExtSystem: readonly(currentExtSystem),
  }
}
