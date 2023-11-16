<script setup lang="ts">
import type { DamAssetType, DamDistributionServiceType } from '@anzusystems/common-admin'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'

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
  <div class="text-body-2">Unsupported distribution</div>
</template>
