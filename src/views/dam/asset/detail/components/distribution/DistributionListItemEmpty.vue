<script setup lang="ts">
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import { DistributionServiceType } from '@/types/dam/DamConfig'

withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: AssetType
    distributionType: DistributionServiceType | null
  }>(),
  {}
)
</script>

<template>
  <div class="pa-4 pb-8 text-body-2">Unsupported distribution</div>
</template>
