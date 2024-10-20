<script lang="ts" setup>
import { useDamDistributionServiceType } from '@anzusystems/common-admin'
import { computed } from 'vue'

const props = defineProps<{
  serviceName: string
}>()

const { getDistributionServiceTypeOption } = useDamDistributionServiceType()

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
