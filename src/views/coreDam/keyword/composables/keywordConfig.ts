import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'
import { type DamAssetTypeType, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'

export const useKeywordAssetTypeConfig = (assetType: DamAssetTypeType) => {
  const { getDamConfigExtSystem } = useDamConfigState(damClient)
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
