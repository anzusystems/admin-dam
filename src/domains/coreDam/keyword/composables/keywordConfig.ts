import { useDamConfigState } from '@anzusystems/common-admin'
import type { DamAssetTypeType } from '@anzusystems/common-admin'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { damClient } from '@/shared/apiClients/damClient'

export const useKeywordAssetTypeConfig = (assetType: DamAssetTypeType) => {
  const { getDamConfigExtSystem } = useDamConfigState(damClient)
  const { currentExtSystemId } = useCurrentExtSystem()

  const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
  if (isUndefined(configExtSystem)) {
    throw new Error('Ext system must be initialised.')
  }

  const keywordEnabled = computed(() => {
    return configExtSystem[assetType]?.keywords?.enabled ?? false
  })

  const keywordRequired = computed(() => {
    return configExtSystem[assetType]?.keywords?.required ?? false
  })

  return {
    keywordEnabled,
    keywordRequired,
  }
}
