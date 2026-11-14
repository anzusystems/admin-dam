import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { damClient } from '@/shared/apiClients/damClient'
import { type DamAssetTypeType, useDamConfigState } from '@anzusystems/common-admin'

export const isSourceEnabled = (assetType: DamAssetTypeType) => {
  const { getDamConfigExtSystem } = useDamConfigState(damClient)
  const { currentExtSystemId } = useCurrentExtSystem()

  return !!getDamConfigExtSystem(currentExtSystemId.value)?.[assetType]?.sources?.enabled
}

export const useSourceAssetTypeConfig = (assetType: DamAssetTypeType) => {
  const { getDamConfigExtSystem } = useDamConfigState(damClient)
  const { currentExtSystemId } = useCurrentExtSystem()

  const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
  if (isUndefined(configExtSystem)) {
    throw new Error('Ext system must be initialised.')
  }

  const sourceEnabled = computed(() => {
    return configExtSystem[assetType]?.sources?.enabled ?? false
  })

  const sourceRequired = computed(() => {
    return configExtSystem[assetType]?.sources?.required ?? false
  })

  return {
    sourceEnabled,
    sourceRequired,
  }
}
