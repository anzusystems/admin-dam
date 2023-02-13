<script setup lang="ts">
import { computed } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import DistributionStatusChip from '@/views/dam/asset/detail/components/distribution/DistributionStatusChip.vue'
import { DistributionStatus } from '@/model/dam/valueObject/DistributionStatus'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import { DistributionServiceType } from '@/types/dam/DamConfig'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: AssetType
    distributionType: DistributionServiceType | null
  }>(),
  {}
)

const { t } = useI18n({ useScope: 'global' })

const serviceRequirements = computed(() => {
  return damConfigExtSystem[props.assetType].distribution.distributionRequirements[props.item.distributionService]
})
</script>

<template>
  <div class="text-body-2">
    <VRow>
      <VCol>
        <div class="font-weight-bold">{{ serviceRequirements.title }}</div>
      </VCol>
    </VRow>
    <VRow>
      <VCol>{{ t('coreDam.distribution.common.status') }}: <DistributionStatusChip :status="item.status" /></VCol>
    </VRow>
    <VRow v-if="item.status === DistributionStatus.Distributed">
      <VCol>
        <a :href="'https://www.youtube.com/watch?v=' + item.extId" target="_blank">
          {{ t('coreDam.youtubeDistribution.videoPreviewLink') }}
        </a>
        <br />
        <a :href="'https://studio.youtube.com/video/' + item.extId + '/edit/basic'" target="_blank">
          {{ t('coreDam.youtubeDistribution.videoAdministrationLink') }}
        </a>
      </VCol>
    </VRow>
    <VRow v-else-if="item.status === DistributionStatus.Failed">
      <VCol>{{ t('coreDam.distribution.common.error') }}: {{ item.failReason }}</VCol>
    </VRow>
  </div>
</template>
