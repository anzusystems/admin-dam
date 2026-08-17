import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { damClient } from '@/shared/apiClients/damClient'
import { type DamAssetTypeType, useDamConfigState } from '@anzusystems/common-admin'

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
