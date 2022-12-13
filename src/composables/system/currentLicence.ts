import { readonly, ref, watch } from 'vue'
import { damConfig, damConfigInitialized } from '@/services/DamConfigService'
import type { AssetLicence } from '@/types/dam/AssetLicence'
import { fetchAssetLicence } from '@/services/api/dam/assetLicenceApi'

const currentAssetLicence = ref<AssetLicence>()
const currentAssetLicenceId = ref(0)

export const initCurrentAssetLicence = () => {
  watch(currentAssetLicenceId, async () => {
    if (currentAssetLicenceId.value) {
      currentAssetLicence.value = await fetchAssetLicence(currentAssetLicenceId.value)
    }
  })

  return new Promise((resolve, reject) => {
    if (!damConfigInitialized.value) {
      console.error('Config must be loaded first.')
      reject(false)
    }
    if (damConfig.settings.allowSelectLicenceId) {
      console.error('Not yet implemented.')
      reject(false)
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
