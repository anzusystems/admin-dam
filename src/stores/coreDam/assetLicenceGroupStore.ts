import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAssetLicenceGroupFactory } from '@/model/coreDam/factory/AssetLicenceGroupFactory'
import type { AssetLicenceGroup } from '@/types/coreDam/AssetLicenceGroup'
import { ref } from 'vue'

export const useAssetLicenceGroupOneStore = defineStore('assetLicenceGroupOneStore', () => {
  const { createDefault } = useAssetLicenceGroupFactory()

  const assetLicenceGroup = ref<AssetLicenceGroup>(createDefault())

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
