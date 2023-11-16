<script setup lang="ts">
import type { DamAssetType } from '@anzusystems/common-admin'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import type { DamDistributionServiceType } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: DamAssetType
    distributionType: DamDistributionServiceType | null
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
