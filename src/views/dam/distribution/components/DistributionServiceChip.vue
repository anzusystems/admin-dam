<script lang="ts" setup>
import { computed } from 'vue'
import { useDistributionServiceType } from '@/model/dam/valueObject/DistributionServiceType'

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
    <VChip rounded="lg" size="small" variant="tonal" v-if="item">
      {{ item.title }}
    </VChip>
  </div>
</template>
