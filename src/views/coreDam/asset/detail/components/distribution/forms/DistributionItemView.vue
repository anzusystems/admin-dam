<script lang="ts" setup>
import type { DistributionItem } from '@/types/coreDam/Distribution'
import { computed } from 'vue'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { type DamAssetTypeType, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'

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
  return configExtSystem[props.assetType].distribution.distributionRequirements[distribution.value.distributionService]
})
</script>

<template>
  <VRow>
    <VCol>
      <span class="font-weight-bold">{{ serviceRequirements.title }}</span> {{ distribution.extId }}
    </VCol>
  </VRow>
</template>
