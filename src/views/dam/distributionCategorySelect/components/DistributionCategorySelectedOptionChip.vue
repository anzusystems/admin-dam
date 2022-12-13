<script lang="ts" setup>
import type { DistributionCategory } from '@/types/dam/DistributionCategory'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    distributionCategory: DistributionCategory
    serviceSlug: string
  }>(),
  {}
)

const selectedOption = computed(() =>
  props.distributionCategory.selectedOptionsDetail.find((select) => select.serviceSlug === props.serviceSlug)
)
</script>

<template>
  <VChip v-if="selectedOption" size="small">{{ selectedOption.name }}</VChip>
  <span v-else>-</span>
</template>
