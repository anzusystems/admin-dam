import { readonly, ref, watch } from 'vue'
import { damConfig, damConfigInitialized } from '@/services/DamConfigService'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'
import { fetchExtSystem } from '@/services/api/coreDam/extSystemApi'
import { useCurrentUser } from '@/composables/system/currentUser'
import { fetchAssetLicence } from '@/services/api/coreDam/assetLicenceApi'
import type { AssetLicence } from '@/types/coreDam/AssetLicence'
import { fetchAsset } from '@/services/api/coreDam/assetApi'
import { isDocId, isString } from '@anzusystems/common-admin'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'

const currentExtSystemId = ref(0)
const currentExtSystem = ref<ExtSystem>()

const currentAssetLicence = ref<AssetLicence>()
const currentAssetLicenceId = ref(0)

export const initCurrentExtSystemAndLicence = (loadFromAsset = false, assetId: string | undefined = undefined) => {
  const { currentUser } = useCurrentUser()

  watch(currentExtSystemId, async (newValue, oldValue) => {
    if (newValue !== oldValue && newValue > 0) {
      currentExtSystem.value = undefined
      currentExtSystem.value = await fetchExtSystem(currentExtSystemId.value)
    }
  })

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
    if (loadFromAsset && isString(assetId) && isDocId(assetId)) {
      fetchAsset(assetId)
        .then((assetRes) => {
          fetchAssetLicence(assetRes.licence)
            .then((licenceRes) => {
              if (licenceRes.id && licenceRes.extSystem) {
                const assetDetailStore = useAssetDetailStore()
                assetDetailStore.directDetailLoad = true
                assetDetailStore.setAsset(assetRes)
                currentAssetLicenceId.value = licenceRes.id
                currentExtSystemId.value = licenceRes.extSystem
                resolve(true)
                return
              }
              reject(false)
              return
            })
            .catch(() => {
              reject(false)
              return
            })
          reject(false)
          return
        })
        .catch(() => {
          reject(false)
          return
        })
    }
    if (damConfig.settings.allowSelectExtSystem && damConfig.settings.allowSelectLicenceId) {
      if (currentUser.value.selectedLicence) {
        currentExtSystemId.value = currentUser.value.selectedLicence.extSystem
        currentAssetLicenceId.value = currentUser.value.selectedLicence.id
        resolve(true)
        return
      } else if (currentUser.value.assetLicences[0]) {
        currentExtSystemId.value = currentUser.value.assetLicences[0].extSystem
        currentAssetLicenceId.value = currentUser.value.assetLicences[0].id
        resolve(true)
        return
      }
    }
    currentExtSystemId.value = damConfig.settings.defaultExtSystemId
    currentAssetLicenceId.value = damConfig.settings.defaultAssetLicenceId
    resolve(true)
  })
}

export function useCurrentExtSystem() {
  return {
    currentExtSystemId: readonly(currentExtSystemId),
    currentExtSystem: readonly(currentExtSystem),
  }
}

export function useCurrentAssetLicence() {
  return {
    currentAssetLicenceId: readonly(currentAssetLicenceId),
    currentAssetLicence: readonly(currentAssetLicence),
  }
}
