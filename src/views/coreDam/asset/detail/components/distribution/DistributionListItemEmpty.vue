<script setup lang="ts">
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import type { DistributionServiceType } from '@/types/coreDam/DamConfig'

withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: DamAssetType
    distributionType: DistributionServiceType | null
    showRedistribute: boolean
  }>(),
  {}
)
</script>

<template>
  <div class="text-body-2">
    Unsupported distribution
  </div>
</template>
