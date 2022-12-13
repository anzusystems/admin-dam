import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { storeToRefs } from 'pinia'
import { readonly } from 'vue'

export function useAssetDetailActions() {
  const assetDetailStore = useAssetDetailStore()
  const { asset, loader, metadataAreTouched } = storeToRefs(assetDetailStore)

  const metadataTouch = () => {
    metadataAreTouched.value = true
  }
  const metadataUnTouch = () => {
    metadataAreTouched.value = false
  }
  return {
    asset,
    loader,

    metadataAreTouched: readonly(metadataAreTouched),
    metadataTouch,
    metadataUnTouch,
  }
}
