import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAssetLicenceFactory } from '@/model/coreDam/factory/AssetLicenceFactory'
import type { DamAssetLicenceExtended } from '@/model/coreDam/type/AssetLicence'
import { ref } from 'vue'

export const useAssetLicenceOneStore = defineStore('assetLicenceOneStore', () => {
  const { createDefault } = useAssetLicenceFactory()

  const assetLicence = ref<DamAssetLicenceExtended>(createDefault())

  function reset() {
    assetLicence.value = createDefault()
  }

  return {
    assetLicence,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetLicenceOneStore, import.meta.hot))
}
