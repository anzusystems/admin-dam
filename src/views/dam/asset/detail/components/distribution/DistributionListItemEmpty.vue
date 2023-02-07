<script setup lang="ts">
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import type { DistributionServiceResourceName } from '@/types/dam/DamConfig'

withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem
    assetType: AssetType
    resourceName: DistributionServiceResourceName
  }>(),
  {}
)
</script>

<template>
  <div />
</template>
