import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { computed } from 'vue'
import { useDamConfigState } from '@anzusystems/common-admin'

export const useAuthorAssetTypeConfig = (assetType: DamAssetType) => {
  const { damConfigExtSystem } = useDamConfigState()

  const authorEnabled = computed(() => {
    return damConfigExtSystem.value[assetType].authors.enabled
  })

  const authorRequired = computed(() => {
    return damConfigExtSystem.value[assetType].authors.required
  })

  return {
    authorEnabled,
    authorRequired,
  }
}
