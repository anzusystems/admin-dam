import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAssetLicenceFactory } from '@/model/coreDam/factory/AssetLicenceFactory'
import { ref } from 'vue'
import type { AssetLicenceExtended } from '@/types/coreDam/AssetLicence'

export const useAssetLicenceOneStore = defineStore('assetLicenceOneStore', () => {
  const { createDefault } = useAssetLicenceFactory()

  const assetLicence = ref<AssetLicenceExtended>(createDefault())

  function setAssetLicence(newAssetLicence: AssetLicenceExtended) {
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
