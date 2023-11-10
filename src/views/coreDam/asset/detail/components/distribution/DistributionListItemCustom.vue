<script setup lang="ts">
import { computed } from 'vue'
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import DistributionStatusChip from '@/views/coreDam/asset/detail/components/distribution/DistributionStatusChip.vue'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import { isDistributionCustomItem } from '@/types/coreDam/Distribution'
import type { DistributionServiceType } from '@/types/coreDam/DamConfig'
import { useI18n } from 'vue-i18n'
import { DistributionStatus } from '@/model/coreDam/valueObject/DistributionStatus'
import DistributionFailReasonChip from '@/views/coreDam/asset/detail/components/distribution/DistributionFailReasonChip.vue'
import DistributionListItemCustomDistributionDataItem from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemCustomDistributionDataItem.vue'
import { ACopyText } from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: DamAssetType
    distributionType: DistributionServiceType | null
    showRedistribute: boolean
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'openRedistribute'): void
  (e: 'openCancel'): void
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
        {{ t('coreDam.distribution.common.status') }}:
        <DistributionStatusChip :status="item.status" />
        <ABtnTertiary
          v-if="showRedistribute"
          class="ml-2"
          size="small"
          @click.stop="emit('openRedistribute')"
        >
          {{ t('coreDam.distribution.common.redistributeButton') }}
        </ABtnTertiary>
        <ABtnTertiary
          v-if="item.status === DistributionStatus.Waiting"
          class="ml-2"
          size="small"
          @click.stop="emit('openCancel')"
        >
          {{ t('coreDam.distribution.common.cancelDistributionButton') }}
        </ABtnTertiary>
      </VCol>
    </VRow>
    <VRow v-if="item.status === DistributionStatus.Failed">
      <VCol>
        {{ t('coreDam.distribution.common.failReason') }}:
        <DistributionFailReasonChip :status="item.failReason" />
      </VCol>
    </VRow>
    <template v-if="isDistributionCustomItem(item)">
      <VRow>
        <VCol v-if="item.extId.length > 0">
          {{ t('coreDam.distribution.common.extId') }}:
          <ACopyText :value="item.extId" />
        </VCol>
      </VRow>
      <VRow
        v-for="(value, key) in item.distributionData"
        :key="key"
      >
        <VCol>
          <DistributionListItemCustomDistributionDataItem
            :item="value"
            :title="key"
          />
        </VCol>
      </VRow>
    </template>
  </div>
</template>
