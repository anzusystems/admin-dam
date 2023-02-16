<script setup lang="ts">
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import type { DistributionServiceType } from '@/types/dam/DamConfig'

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
  <div class="text-body-2">Unsupported distribution</div>
</template>
