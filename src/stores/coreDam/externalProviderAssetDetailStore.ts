import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AssetExternalProviderDetailDto } from '@/types/coreDam/AssetExternalProvider'

interface State {
  asset: AssetExternalProviderDetailDto | null
  loader: boolean
  detail: boolean
}

export const useExternalProviderAssetDetailStore = defineStore('damExternalProviderAssetDetailStore', {
  state: (): State => ({
    asset: null,
    loader: false,
    detail: false,
  }),
  actions: {
    showDetail() {
      this.detail = true
    },
    hideDetail() {
      this.detail = false
    },
    showLoader() {
      this.loader = true
    },
    hideLoader() {
      this.loader = false
    },
    setAsset(asset: AssetExternalProviderDetailDto) {
      this.asset = asset
    },
    reset() {
      this.asset = null
      this.loader = false
      this.detail = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExternalProviderAssetDetailStore, import.meta.hot))
}
