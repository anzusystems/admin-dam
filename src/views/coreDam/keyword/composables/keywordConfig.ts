import { type DamAssetType, isUndefined } from '@anzusystems/common-admin'
import { useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

export const useKeywordAssetTypeConfig = (assetType: DamAssetType) => {
  const { getDamConfigExtSystem } = useDamConfigState()
  const { currentExtSystemId } = useCurrentExtSystem()

  const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
  if (isUndefined(configExtSystem)) {
    throw new Error('Ext system must be initialised.')
  }

  const keywordEnabled = computed(() => {
    return configExtSystem[assetType].keywords.enabled
  })

  const keywordRequired = computed(() => {
    return configExtSystem[assetType].keywords.required
  })

  return {
    keywordEnabled,
    keywordRequired,
  }
}
