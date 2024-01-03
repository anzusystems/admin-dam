<script setup lang="ts">
import { computed } from 'vue'
import DistributionListItemJw from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemJw.vue'
import DistributionListItemYoutube from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemYoutube.vue'
import DistributionListItemCustom from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemCustom.vue'
import DistributionListItemEmpty from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemEmpty.vue'
import type { DamAssetType } from '@anzusystems/common-admin'
import { DamDistributionServiceType, useDamConfigState } from '@anzusystems/common-admin'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import { useAssetDetailDistributionDialog } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialog'
import { useAssetDetailDistributionDialogCancel } from '@/views/coreDam/asset/detail/composables/assetDetailDistributionDialogCancel'
import { damClient } from '@/services/api/clients/damClient'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: DamAssetType
  }>(),
  {}
)

const { damPrvConfig } = useDamConfigState(damClient)

const distributionType = computed(() => {
  if (damPrvConfig.value.distributionServices[props.item.distributionService]) {
    return damPrvConfig.value.distributionServices[props.item.distributionService].type
  }
  return null
})

const showRedistribute = computed(() => {
  return damPrvConfig.value.distributionServices[props.item.distributionService].allowedRedistributeStatuses.includes(
    props.item.status
  )
})

const componentComputed = computed(() => {
  switch (distributionType.value) {
    case DamDistributionServiceType.Jw:
      return DistributionListItemJw
    case DamDistributionServiceType.Youtube:
      return DistributionListItemYoutube
    case DamDistributionServiceType.Custom:
      return DistributionListItemCustom
    default:
      return DistributionListItemEmpty
  }
})

const { openRedistribute } = useAssetDetailDistributionDialog()
const { openCancel } = useAssetDetailDistributionDialogCancel()
</script>

<template>
  <div class="d-flex flex-column mb-8">
    <component
      :is="componentComputed"
      v-if="distributionType"
      :item="item"
      :asset-type="assetType"
      :distribution-type="distributionType"
      :show-redistribute="showRedistribute"
      @open-redistribute="openRedistribute(item)"
      @open-cancel="openCancel(item.id, distributionType)"
    />
  </div>
</template>
