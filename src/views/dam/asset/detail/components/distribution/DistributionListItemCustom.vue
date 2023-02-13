<script setup lang="ts">
import { computed } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import DistributionStatusChip from '@/views/dam/asset/detail/components/distribution/DistributionStatusChip.vue'
import { DistributionStatus } from '@/model/dam/valueObject/DistributionStatus'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import type { DistributionServiceResourceName } from '@/types/dam/DamConfig'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: AssetType
    resourceName: DistributionServiceResourceName
  }>(),
  {}
)

const { t } = useI18n({ useScope: 'global' })

const serviceRequirements = computed(() => {
  return damConfigExtSystem[props.assetType].distribution.distributionRequirements[props.item.distributionService]
})
</script>

<template>
  <div class="pa-4 pb-8 text-body-2">
    <VRow>
      <VCol>
        <div class="font-weight-bold">{{ serviceRequirements.title }}</div>
      </VCol>
    </VRow>
    <VRow>
      <VCol>{{ t('coreDam.distribution.common.status') }}: <DistributionStatusChip :status="item.status" /></VCol>
    </VRow>
    <VRow v-if="item.status === DistributionStatus.Distributed">
      <VCol>todo</VCol>
    </VRow>
  </div>
</template>
