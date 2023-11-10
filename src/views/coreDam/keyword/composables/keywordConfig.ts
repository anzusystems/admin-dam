import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'

export const useKeywordAssetTypeConfig = (assetType: DamAssetType) => {
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
