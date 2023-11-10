import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { computed } from 'vue'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'

export const useAuthorAssetTypeConfig = (assetType: DamAssetType) => {
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
