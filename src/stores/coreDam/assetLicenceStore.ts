import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAssetLicenceFactory } from '@/model/coreDam/factory/AssetLicenceFactory'
import type { DamAssetLicence } from '@anzusystems/common-admin'
import { ref } from 'vue'

export const useAssetLicenceOneStore = defineStore('assetLicenceOneStore', () => {
  const { createDefault } = useAssetLicenceFactory()

  const assetLicence = ref<DamAssetLicence>(createDefault())

  function setAssetLicence(newAssetLicence: DamAssetLicence) {
    assetLicence.value = newAssetLicence
  }

  function reset() {
    assetLicence.value = createDefault()
  }

  return {
    assetLicence,
    setAssetLicence,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetLicenceOneStore, import.meta.hot))
}
