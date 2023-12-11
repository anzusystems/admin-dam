import type { DamAssetType } from '@anzusystems/common-admin'
import { useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'

export const useKeywordAssetTypeConfig = (assetType: DamAssetType) => {
  const { damConfigExtSystem } = useDamConfigState()

  const keywordEnabled = computed(() => {
    return damConfigExtSystem.value[assetType].keywords.enabled
  })

  const keywordRequired = computed(() => {
    return damConfigExtSystem.value[assetType].keywords.required
  })

  return {
    keywordEnabled,
    keywordRequired,
  }
}
