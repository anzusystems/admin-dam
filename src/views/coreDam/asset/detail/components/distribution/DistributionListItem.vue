<script setup lang="ts">
import { computed } from 'vue'
import DistributionListItemJw from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemJw.vue'
import DistributionListItemYoutube from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemYoutube.vue'
import DistributionListItemCustom from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemCustom.vue'
import DistributionListItemEmpty from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemEmpty.vue'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import { DistributionServiceType } from '@/types/coreDam/DamConfig'
import { damConfig } from '@/services/DamConfigService'
import { useAssetDetailDistributionDialog } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialog'

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

const showRedistribute = computed(() => {
  return damConfig.distributionServices[props.item.distributionService].allowedRedistributeStatuses.includes(
    props.item.status
  )
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

const { openRedistribute } = useAssetDetailDistributionDialog()
</script>

<template>
  <div class="d-flex flex-column mb-8">
    <component
      :is="componentComputed"
      :item="item"
      :asset-type="assetType"
      :distribution-type="distributionType"
      :show-redistribute="showRedistribute"
      @open-redistribute="openRedistribute(item)"
    />
  </div>
</template>
