import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAssetLicenceFactory } from '@/model/dam/factory/AssetLicenceFactory'
import type { AssetLicence } from '@/types/dam/AssetLicence'

const { createDefault } = useAssetLicenceFactory()

interface State {
  assetLicence: AssetLicence
}

export const useAssetLicenceOneStore = defineStore('assetLicenceOneStore', {
  state: (): State => ({
    assetLicence: createDefault(),
  }),
  actions: {
    setAssetLicence(assetLicence: AssetLicence) {
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
