<script lang="ts" setup>
import { computed } from 'vue'
import {
  type DistributionFailReason,
  useDistributionFailReason,
} from '@/model/coreDam/valueObject/DistributionFailReason'

const props = withDefaults(
  defineProps<{
    status: DistributionFailReason
  }>(),
  {}
)

const { getDistributionFailReasonOption } = useDistributionFailReason()
const statusOption = computed(() => {
  return getDistributionFailReasonOption(props.status)
})
</script>

<template>
  <VChip v-if="statusOption" label size="small">
    {{ statusOption.title }}
  </VChip>
</template>
