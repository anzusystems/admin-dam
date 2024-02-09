<script lang="ts" setup>
import { computed } from 'vue'
import { useDamDistributionServiceType } from '@anzusystems/common-admin'
import { damClient } from '@/services/api/clients/damClient'

const props = defineProps<{
  serviceName: string
}>()

const { getDistributionServiceTypeOption } = useDamDistributionServiceType(damClient)

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
