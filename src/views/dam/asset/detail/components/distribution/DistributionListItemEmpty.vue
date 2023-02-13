<script setup lang="ts">
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import type { DistributionServiceResourceName } from '@/types/dam/DamConfig'

withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: AssetType
    resourceName: DistributionServiceResourceName
  }>(),
  {}
)
</script>

<template>
  <div class="pa-4 pb-8 text-body-2">Unsupported distribution</div>
</template>
