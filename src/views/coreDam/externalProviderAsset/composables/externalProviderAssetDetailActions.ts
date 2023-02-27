import { storeToRefs } from 'pinia'
import { useExternalProviderAssetDetailStore } from '@/stores/coreDam/externalProviderAssetDetailStore'

export function useExternalProviderAssetDetailActions() {
  const externalProviderAssetDetailStore = useExternalProviderAssetDetailStore()
  const { asset, loader } = storeToRefs(externalProviderAssetDetailStore)

  return {
    asset,
    loader,
  }
}
