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
import { useAssetDetailDistributionDialog } from '@/views/dam/asset/detail/composables/assetDetailDistributionDialog'

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
    <component :is="componentComputed" :item="item" :asset-type="assetType" :distribution-type="distributionType" />
    <div v-if="showRedistribute">
      <VBtn variant="flat" color="secondary" size="small" @click.stop="openRedistribute(item)">Redistribute</VBtn>
    </div>
  </div>
</template>
