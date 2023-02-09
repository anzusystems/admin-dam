<script lang="ts" setup>
import type { DistributionImagePreviewDto } from '@/types/dam/DistributionImagePreviewDto'

const props = withDefaults(
  defineProps<{
    item: DistributionImagePreviewDto
  }>(),
  {}
)
</script>

<template>
  <div>
    <div>{{ item.id }}</div>
    <div>{{ item.url }}</div>
    <div>{{ item.service }}</div>
  </div>
</template>
