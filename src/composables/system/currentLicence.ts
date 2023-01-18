import { readonly, ref, watch } from 'vue'
import { damConfig, damConfigInitialized } from '@/services/DamConfigService'
import type { AssetLicence } from '@/types/dam/AssetLicence'
import { fetchAssetLicence } from '@/services/api/dam/assetLicenceApi'
import { useCurrentUser } from '@/composables/system/currentUser'

const currentAssetLicence = ref<AssetLicence>()
const currentAssetLicenceId = ref(0)

export const initCurrentAssetLicence = () => {
  const { currentUser, currentUserIsSuperAdmin } = useCurrentUser()

  watch(currentAssetLicenceId, async (newValue, oldValue) => {
    if (newValue !== oldValue && newValue > 0) {
      currentAssetLicence.value = undefined
      currentAssetLicence.value = await fetchAssetLicence(currentAssetLicenceId.value)
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
    if (damConfig.settings.allowSelectLicenceId) {
      if (currentUserIsSuperAdmin.value && currentUser.value.selectedLicence) {
        currentAssetLicenceId.value = currentUser.value.selectedLicence
        resolve(true)
        return
      } else if (currentUser.value.selectedLicence) {
        const foundLicence = currentUser.value.assetLicences.find(
          (item) => item.id === currentUser.value!.selectedLicence
        )
        if (foundLicence) {
          currentAssetLicenceId.value = foundLicence.id
          resolve(true)
          return
        }
      } else if (currentUser.value.assetLicences[0]) {
        currentAssetLicenceId.value = currentUser.value.assetLicences[0].id
        resolve(true)
        return
      }
    }
    currentAssetLicenceId.value = damConfig.settings.defaultAssetLicenceId
    resolve(true)
  })
}

export function useCurrentAssetLicence() {
  return {
    currentAssetLicenceId: readonly(currentAssetLicenceId),
    currentAssetLicence: readonly(currentAssetLicence),
  }
}
