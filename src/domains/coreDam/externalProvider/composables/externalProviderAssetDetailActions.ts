import { useExternalProviderAssetDetailStore } from '@/domains/coreDam/externalProvider/store/externalProviderAssetDetailStore'

export function useExternalProviderAssetDetailActions() {
  const externalProviderAssetDetailStore = useExternalProviderAssetDetailStore()
  const { asset, loader } = storeToRefs(externalProviderAssetDetailStore)

  return {
    asset,
    loader,
  }
}
