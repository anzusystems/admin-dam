import type { AssetExternalProviderDetailDto } from '@/domains/coreDam/asset/types/AssetExternalProvider'

export const useExternalProviderAssetDetailStore = defineStore('damExternalProviderAssetDetailStore', () => {
  const asset = ref<AssetExternalProviderDetailDto | null>(null)
  const loader = ref(false)
  const detail = ref(false)

  /* Several detail fetches can be on the wire at once and they do not come back in order: only the
   * newest may write here, and nothing may once the user has left. */
  let detailRequests = 0
  const startDetailRequest = () => ++detailRequests
  const isCurrentDetailRequest = (token: number) => token === detailRequests
  const abandonDetailRequests = () => detailRequests++

  function showDetail() {
    detail.value = true
  }

  function hideDetail() {
    // Only the dialog; the requests stay, because the right-hand panel reads this same store.
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
    abandonDetailRequests()
    asset.value = null
    loader.value = false
    detail.value = false
  }

  return {
    asset,
    loader,
    detail,
    startDetailRequest,
    isCurrentDetailRequest,
    abandonDetailRequests,
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
