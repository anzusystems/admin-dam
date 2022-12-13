<script setup lang="ts">
import { computed } from 'vue'
import DistributionListItemJw from '@/views/dam/asset/detail/components/distribution/DistributionListItemJw.vue'
import DistributionListItemYoutube from '@/views/dam/asset/detail/components/distribution/DistributionListItemYoutube.vue'
import DistributionListItemCustom from '@/views/dam/asset/detail/components/distribution/DistributionListItemCustom.vue'
import DistributionListItemEmpty from '@/views/dam/asset/detail/components/distribution/DistributionListItemEmpty.vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import { DistributionServiceResourceName } from '@/types/dam/DamConfig'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: AssetType
  }>(),
  {}
)

const componentComputed = computed(() => {
  switch (props.item._resourceName) {
    case DistributionServiceResourceName.Jw:
      return DistributionListItemJw
    case DistributionServiceResourceName.Youtube:
      return DistributionListItemYoutube
    case DistributionServiceResourceName.Custom:
      return DistributionListItemCustom
    default:
      return DistributionListItemEmpty
  }
})
</script>

<template>
  <component
    :is="componentComputed"
    :item="item"
    :asset-type="assetType"
    :resource-name="item._resourceName"
  ></component>
</template>
