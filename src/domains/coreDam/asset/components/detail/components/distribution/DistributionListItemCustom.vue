<script setup lang="ts">
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import { damClient } from '@/shared/apiClients/damClient'
import type {
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
import { isDistributionCustomItem } from '@/domains/coreDam/asset/types/Distribution'
import DistributionFailReasonChip from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionFailReasonChip.vue'
import DistributionListItemCustomDistributionDataItem from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionListItemCustomDistributionDataItem.vue'
import DistributionStatusChip from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionStatusChip.vue'
import {
  ACopyText,
  type DamAssetTypeType,
  type DamDistributionServiceTypeType,
  DamDistributionStatus,
  useDamConfigState,
} from '@anzusystems/common-admin'

const props = withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: DamAssetTypeType
    distributionType: DamDistributionServiceTypeType | null
    showRedistribute: boolean
  }>(),
  {}
)
const emit = defineEmits<{
  (e: 'openRedistribute'): void
  (e: 'openCancel'): void
}>()

const { t } = useI18n()

const { getDamConfigExtSystem } = useDamConfigState(damClient)
const { currentExtSystemId } = useCurrentExtSystem()
const configExtSystem = getDamConfigExtSystem(currentExtSystemId.value)
if (isUndefined(configExtSystem)) {
  throw new Error('Ext system must be initialised.')
}

const serviceRequirements = computed(() => {
  return configExtSystem[props.assetType]?.distribution?.distributionRequirements[props.item.distributionService]
})
</script>

<template>
  <div
    v-if="serviceRequirements"
    class="text-body-medium"
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
          v-if="item.status === DamDistributionStatus.Waiting"
          class="ml-2"
          size="small"
          @click.stop="emit('openCancel')"
        >
          {{ t('coreDam.distribution.common.cancelDistributionButton') }}
        </ABtnTertiary>
      </VCol>
    </VRow>
    <VRow v-if="item.status === DamDistributionStatus.Failed">
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
