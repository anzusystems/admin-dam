import { acceptHMRUpdate, defineStore } from 'pinia'
import type { AssetExternalProviderDetailDto } from '@/types/coreDam/AssetExternalProvider'
import { ref } from 'vue'

export const useExternalProviderAssetDetailStore = defineStore('damExternalProviderAssetDetailStore', () => {
  const asset = ref<AssetExternalProviderDetailDto | null>(null)
  const loader = ref(false)
  const detail = ref(false)

  function showDetail() {
    detail.value = true
  }

  function hideDetail() {
    detail.value = false
  }

  function showLoader() {
    loader.value = true
  }

  function hideLoader() {
    loader.value = false
  }

  function setAsset(newAsset: AssetExternalProviderDetailDto) {
    asset.value = newAsset
  }

  function reset() {
    asset.value = null
    loader.value = false
    detail.value = false
  }

  return {
    asset,
    loader,
    detail,
    showDetail,
    hideDetail,
    showLoader,
    hideLoader,
    setAsset,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useExternalProviderAssetDetailStore, import.meta.hot))
}
