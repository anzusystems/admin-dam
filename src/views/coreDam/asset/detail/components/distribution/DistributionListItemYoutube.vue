<script setup lang="ts">
import { computed } from 'vue'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import DistributionStatusChip from '@/views/coreDam/asset/detail/components/distribution/DistributionStatusChip.vue'
import { DistributionStatus } from '@/model/coreDam/valueObject/DistributionStatus'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import type { DistributionServiceType } from '@/types/coreDam/DamConfig'
import { useI18n } from 'vue-i18n'
import DistributionFailReasonChip from '@/views/coreDam/asset/detail/components/distribution/DistributionFailReasonChip.vue'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: AssetType
    distributionType: DistributionServiceType | null
    showRedistribute: boolean
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'openRedistribute'): void
}>()

const { t } = useI18n()

const serviceRequirements = computed(() => {
  return damConfigExtSystem[props.assetType].distribution.distributionRequirements[props.item.distributionService]
})
</script>

<template>
  <div
    v-if="serviceRequirements"
    class="text-body-2"
  >
    <VRow>
      <VCol>
        <div class="font-weight-bold">
          {{ serviceRequirements.title }}
        </div>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        {{ t('coreDam.distribution.common.status') }}: <DistributionStatusChip :status="item.status" />
        <ABtnTertiary
          v-if="showRedistribute"
          class="ml-2"
          size="small"
          @click.stop="emit('openRedistribute')"
        >
          {{ t('coreDam.distribution.common.redistributeButton') }}
        </ABtnTertiary>
      </VCol>
    </VRow>
    <VRow v-if="item.status === DistributionStatus.Failed">
      <VCol>
        {{ t('coreDam.distribution.common.failReason') }}: <DistributionFailReasonChip :status="item.failReason" />
      </VCol>
    </VRow>
    <VRow v-if="item.status === DistributionStatus.Distributed">
      <VCol>
        <a
          :href="'https://www.youtube.com/watch?v=' + item.extId"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('coreDam.youtubeDistribution.videoPreviewLink') }}
        </a>
        <br>
        <a
          :href="'https://studio.youtube.com/video/' + item.extId + '/edit/basic'"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('coreDam.youtubeDistribution.videoAdministrationLink') }}
        </a>
      </VCol>
    </VRow>
  </div>
</template>
