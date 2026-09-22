import { useAssetLicenceFactory } from '@/domains/coreDam/assetLicence/factory/AssetLicenceFactory'
import type { DamAssetLicenceExtended } from '@/domains/coreDam/assetLicence/types/AssetLicence'

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
