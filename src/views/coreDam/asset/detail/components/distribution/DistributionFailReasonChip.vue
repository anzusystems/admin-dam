<script lang="ts" setup>
import { computed } from 'vue'
import {
  type DistributionFailReasonType,
  useDistributionFailReason,
} from '@/model/coreDam/valueObject/DistributionFailReason'

const props = withDefaults(
  defineProps<{
    status: DistributionFailReasonType
  }>(),
  {}
)

const { getDistributionFailReasonOption } = useDistributionFailReason()
const statusOption = computed(() => {
  return getDistributionFailReasonOption(props.status)
})
</script>

<template>
  <VChip
    v-if="statusOption"
    label
    size="small"
  >
    {{ statusOption.title }}
  </VChip>
</template>
