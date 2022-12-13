import { acceptHMRUpdate, defineStore } from 'pinia'
import { useAssetLicenceFactory } from '@/model/dam/factory/AssetLicenceFactory'
import type { AssetLicence } from '@/types/dam/AssetLicence'

const { createDefault } = useAssetLicenceFactory()

interface State {
  assetLicence: AssetLicence
  loaded: boolean
}

export const useAssetLicenceOneStore = defineStore('assetLicenceOneStore', {
  state: (): State => ({
    assetLicence: createDefault(),
    loaded: false,
  }),
  actions: {
    setAssetLicence(assetLicence: AssetLicence) {
      this.assetLicence = assetLicence
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.assetLicence = createDefault()
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAssetLicenceOneStore, import.meta.hot))
}
