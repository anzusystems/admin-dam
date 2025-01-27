<script setup lang="ts">
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import type { DamAssetTypeType, DamDistributionServiceTypeType } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: DamAssetTypeType
    distributionType: DamDistributionServiceTypeType | null
    showRedistribute: boolean
  }>(),
  {}
)
</script>

<template>
  <div class="text-body-2">Unsupported distribution</div>
</template>
