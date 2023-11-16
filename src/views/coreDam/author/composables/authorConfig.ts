import type { DamAssetType } from '@anzusystems/common-admin'
import { useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'

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
