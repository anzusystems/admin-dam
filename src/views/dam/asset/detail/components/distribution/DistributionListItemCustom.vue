<script setup lang="ts">
import { computed } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import DistributionStatusChip from '@/views/dam/asset/detail/components/distribution/DistributionStatusChip.vue'
import { DistributionStatus } from '@/model/dam/valueObject/DistributionStatus'
import type { DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import type { DistributionServiceResourceName } from '@/types/dam/DamConfig'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem
    assetType: AssetType
    resourceName: DistributionServiceResourceName
  }>(),
  {}
)

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
      <VCol>Status: <DistributionStatusChip :status="item.status" /></VCol>
    </VRow>
    <VRow v-if="item.status === DistributionStatus.Distributed">
      <VCol>
        <a :href="'https://dashboard.jwplayer.com/#/content/detail?key=' + item.extId" target="_blank">
          Administrácia videa v Jw Player
        </a>
      </VCol>
    </VRow>
  </div>
</template>
