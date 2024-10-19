<script lang="ts" setup>
import { useDistributionStatus } from '@/model/coreDam/valueObject/DamDistributionStatus'
import type { DamDistributionStatusType } from '@anzusystems/common-admin'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status: DamDistributionStatusType
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
