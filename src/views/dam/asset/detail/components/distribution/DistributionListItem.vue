<script setup lang="ts">
import { computed } from 'vue'
import DistributionListItemJw from '@/views/dam/asset/detail/components/distribution/DistributionListItemJw.vue'
import DistributionListItemYoutube from '@/views/dam/asset/detail/components/distribution/DistributionListItemYoutube.vue'
import DistributionListItemCustom from '@/views/dam/asset/detail/components/distribution/DistributionListItemCustom.vue'
import DistributionListItemEmpty from '@/views/dam/asset/detail/components/distribution/DistributionListItemEmpty.vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import { DistributionServiceType } from '@/types/dam/DamConfig'
import { damConfig } from '@/services/DamConfigService'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: AssetType
  }>(),
  {}
)

const distributionType = computed(() => {
  if (damConfig.distributionServices[props.item.distributionService]) {
    return damConfig.distributionServices[props.item.distributionService].type
  }
  return null
})

const componentComputed = computed(() => {
  switch (distributionType.value) {
    case DistributionServiceType.Jw:
      return DistributionListItemJw
    case DistributionServiceType.Youtube:
      return DistributionListItemYoutube
    case DistributionServiceType.Custom:
      return DistributionListItemCustom
    default:
      return DistributionListItemEmpty
  }
})
</script>

<template>
  <component :is="componentComputed" :item="item" :asset-type="assetType" :distribution-type="distributionType" />
</template>
