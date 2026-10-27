<script lang="ts" setup>
import { isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import type { DamAssetTypeType } from '@anzusystems/common-admin'
import { computed } from 'vue'

import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type { DistributionItem } from '@/domains/coreDam/asset/types/Distribution'
import { damClient } from '@/shared/apiClients/damClient'

const props = withDefaults(
  defineProps<{
    assetType: DamAssetTypeType
  }>(),
  {}
)

const distribution = defineModel<DistributionItem>({ required: true })

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const serviceRequirements = computed(() => {
  const requirements = configExtSystem[props.assetType]?.distribution?.distributionRequirements
  return requirements?.[distribution.value.distributionService]
})
</script>

<template>
  <VRow>
    <VCol>
      <span class="font-weight-bold">{{ serviceRequirements?.title }}</span> {{ distribution.extId }}
    </VCol>
  </VRow>
</template>
