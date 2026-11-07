import type { DamAssetLicenceGroup } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

import { useAssetLicenceGroupFactory } from '@/domains/coreDam/assetLicenceGroup/factory/AssetLicenceGroupFactory'

export const useAssetLicenceGroupOneStore = defineStore('assetLicenceGroupOneStore', () => {
  const { createDefault } = useAssetLicenceGroupFactory()

  const assetLicenceGroup = ref<DamAssetLicenceGroup>(createDefault())

  function reset() {
    assetLicenceGroup.value = createDefault()
  }

  return {
    assetLicenceGroup,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetLicenceGroupOneStore, import.meta.hot))
}
