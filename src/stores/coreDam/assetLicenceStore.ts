import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAssetLicenceFactory } from '@/model/coreDam/factory/AssetLicenceFactory'
import type { DamAssetLicence } from '@anzusystems/common-admin'

const { createDefault } = useAssetLicenceFactory()

interface State {
  assetLicence: DamAssetLicence
}

export const useAssetLicenceOneStore = defineStore('assetLicenceOneStore', {
  state: (): State => ({
    assetLicence: createDefault(),
  }),
  actions: {
    setAssetLicence(assetLicence: DamAssetLicence) {
      this.assetLicence = assetLicence
    },
    reset() {
      this.assetLicence = createDefault()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetLicenceOneStore, import.meta.hot))
}
