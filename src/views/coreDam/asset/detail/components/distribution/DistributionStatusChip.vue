<script lang="ts" setup>
import { computed } from 'vue'
import { useDistributionStatus } from '@/model/coreDam/valueObject/DamDistributionStatus'
import type { DamDistributionStatus } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    status: DamDistributionStatus
  }>(),
  {}
)

const { getDistributionStatusOption } = useDistributionStatus()
const statusOption = computed(() => {
  return getDistributionStatusOption(props.status)
})
</script>

<template>
  <VChip
    v-if="statusOption"
    label
    size="small"
    :color="statusOption.color"
  >
    {{ statusOption.title }}
  </VChip>
</template>
