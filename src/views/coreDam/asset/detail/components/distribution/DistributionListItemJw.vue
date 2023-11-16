<script setup lang="ts">
import { computed } from 'vue'
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import DistributionStatusChip from '@/views/coreDam/asset/detail/components/distribution/DistributionStatusChip.vue'
import { DamDistributionStatus } from '@/model/coreDam/valueObject/DamDistributionStatus'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import type { DamDistributionServiceType } from '@/types/coreDam/DamConfig'
import { useI18n } from 'vue-i18n'
import DistributionFailReasonChip from '@/views/coreDam/asset/detail/components/distribution/DistributionFailReasonChip.vue'
import { useDamConfigState } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: DamAssetType
    distributionType: DamDistributionServiceType | null
    showRedistribute: boolean
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'openRedistribute'): void
}>()

const { t } = useI18n()

const { damConfigExtSystem } = useDamConfigState()

const serviceRequirements = computed(() => {
  return damConfigExtSystem.value[props.assetType].distribution.distributionRequirements[props.item.distributionService]
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
    <VRow v-if="item.status === DamDistributionStatus.Failed">
      <VCol>
        {{ t('coreDam.distribution.common.failReason') }}: <DistributionFailReasonChip :status="item.failReason" />
      </VCol>
    </VRow>
    <VRow v-if="item.status === DamDistributionStatus.Distributed">
      <VCol>
        <a
          :href="'https://dashboard.jwplayer.com/#/content/detail?key=' + item.extId"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('coreDam.jwDistribution.videoAdministrationLink') }}
        </a>
      </VCol>
    </VRow>
  </div>
</template>
