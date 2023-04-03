<script lang="ts" setup>
import { computed } from 'vue'
import { useDistributionServiceType } from '@/model/coreDam/valueObject/DistributionServiceType'

const props = defineProps<{
  serviceName: string
}>()

const { getDistributionServiceTypeOption } = useDistributionServiceType()

const item = computed(() => {
  return getDistributionServiceTypeOption(props.serviceName)
})
</script>

<template>
  <div class="d-inline-flex">
    <VChip
      v-if="item"
      rounded="lg"
      size="small"
      variant="tonal"
    >
      {{ item.title }}
    </VChip>
  </div>
</template>
