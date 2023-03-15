import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'

export const useKeywordAssetTypeConfig = (assetType: AssetType) => {
  const keywordEnabled = computed(() => {
    return damConfigExtSystem[assetType].keywords.enabled
  })

  const keywordRequired = computed(() => {
    return damConfigExtSystem[assetType].keywords.required
  })

  return {
    keywordEnabled,
    keywordRequired,
  }
}
