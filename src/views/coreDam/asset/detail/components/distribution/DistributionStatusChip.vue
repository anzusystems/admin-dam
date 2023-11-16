<script lang="ts" setup>
import { computed } from 'vue'
import { type DamDistributionStatus, useDistributionStatus } from '@/model/coreDam/valueObject/DamDistributionStatus'

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
