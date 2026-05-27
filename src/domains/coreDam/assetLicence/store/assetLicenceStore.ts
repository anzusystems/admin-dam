import { useAssetLicenceFactory } from '@/domains/coreDam/assetLicence/factory/AssetLicenceFactory'
import type { DamAssetLicence } from '@anzusystems/common-admin'

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
