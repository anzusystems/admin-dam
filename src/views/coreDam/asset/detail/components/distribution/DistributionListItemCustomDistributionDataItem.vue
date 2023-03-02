<script setup lang="ts">
import type { DistributionDataItem } from '@/types/coreDam/Distribution'
import { DistributionDataItemType } from '@/types/coreDam/Distribution'

withDefaults(
  defineProps<{
    title: string
    item: DistributionDataItem
  }>(),
  {}
)
</script>

<template>
  <a v-if="item.type === DistributionDataItemType.Url && item.value && item.value.length > 0" :href="item.value">
    {{ title }}
  </a>
</template>
