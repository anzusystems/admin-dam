import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAssetLicenceGroupFactory } from '@/model/coreDam/factory/AssetLicenceGroupFactory'
import { ref } from 'vue'
import type { DamAssetLicenceGroup } from '@anzusystems/common-admin'

export const useAssetLicenceGroupOneStore = defineStore('assetLicenceGroupOneStore', () => {
  const { createDefault } = useAssetLicenceGroupFactory()

  const assetLicenceGroup = ref<DamAssetLicenceGroup>(createDefault())

  function reset() {
    assetLicenceGroup.value = createDefault()
  }

  return {
    assetLicenceGroup,
    reset
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetLicenceGroupOneStore, import.meta.hot))
}
