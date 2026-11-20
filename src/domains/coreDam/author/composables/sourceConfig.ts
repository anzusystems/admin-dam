import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { type DamAssetTypeType, isDamSourceEnabled, useDamSourceAssetTypeConfig } from '@anzusystems/common-admin'

export const isSourceEnabled = (assetType: DamAssetTypeType) => {
  const { currentExtSystemId } = useCurrentExtSystem()

  return isDamSourceEnabled(assetType, currentExtSystemId.value)
}

export const useSourceAssetTypeConfig = (assetType: DamAssetTypeType) => {
  const { currentExtSystemId } = useCurrentExtSystem()

  return useDamSourceAssetTypeConfig(assetType, currentExtSystemId.value)
}
