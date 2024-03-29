import { type DamAssetType, isUndefined } from '@anzusystems/common-admin'
import { useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'

export const useAuthorAssetTypeConfig = (assetType: DamAssetType) => {
  const { getDamConfigExtSystem } = useDamConfigState(damClient)
  const { currentExtSystemId } = useCurrentExtSystem()

  const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
  if (isUndefined(configExtSystem)) {
    throw new Error('Ext system must be initialised.')
  }

  const authorEnabled = computed(() => {
    return configExtSystem[assetType].authors.enabled
  })

  const authorRequired = computed(() => {
    return configExtSystem[assetType].authors.required
  })

  return {
    authorEnabled,
    authorRequired,
  }
}
