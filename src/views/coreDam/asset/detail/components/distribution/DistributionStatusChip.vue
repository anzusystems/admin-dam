<script lang="ts" setup>
import { computed } from 'vue'
import { type DistributionStatus, useDistributionStatus } from '@/model/coreDam/valueObject/DistributionStatus'

const props = withDefaults(
  defineProps<{
    status: DistributionStatus
  }>(),
  {}
)

const { getDistributionStatusOption } = useDistributionStatus()
const statusOption = computed(() => {
  return getDistributionStatusOption(props.status)
})
</script>

<template>
  <VChip v-if="statusOption" label size="small" :color="statusOption.color">
    {{ statusOption.title }}
  </VChip>
</template>
