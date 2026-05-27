import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'
import { type DamAssetTypeType, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'

export const useAuthorAssetTypeConfig = (assetType: DamAssetTypeType) => {
  const { getDamConfigExtSystem } = useDamConfigState(damClient)
  const { currentExtSystemId } = useCurrentExtSystem()

  const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
  if (isUndefined(configExtSystem)) {
    throw new Error('Ext system must be initialised.')
  }

  const authorEnabled = computed(() => {
    return configExtSystem[assetType]?.authors?.enabled ?? false
  })

  const authorRequired = computed(() => {
    return configExtSystem[assetType]?.authors?.required ?? false
  })

  return {
    authorEnabled,
    authorRequired,
  }
}
