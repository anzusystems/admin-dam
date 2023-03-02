import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'

export const useAuthorAssetTypeConfig = (assetType: AssetType) => {
  const authorEnabled = computed(() => {
    return damConfigExtSystem[assetType].authors.enabled
  })

  const authorRequired = computed(() => {
    return damConfigExtSystem[assetType].authors.required
  })

  return {
    authorEnabled,
    authorRequired,
  }
}
