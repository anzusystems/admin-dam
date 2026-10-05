<script setup lang="ts">
import { ACopyText, DamDistributionStatus, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import type { DamAssetTypeType, DamDistributionServiceTypeType } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DistributionFailReasonChip from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionFailReasonChip.vue'
import DistributionListItemCustomDistributionDataItem from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionListItemCustomDistributionDataItem.vue'
import DistributionStatusChip from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionStatusChip.vue'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type {
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
import { isDistributionCustomItem } from '@/domains/coreDam/asset/types/Distribution'
import { ACL, useAuth } from '@/domains/system/auth/auth'
import { damClient } from '@/shared/apiClients/damClient'

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

const { can } = useAuth()
// TODO(BE): core-dam deletes a custom distribution (DELETE /custom-distribution/{id}) under dam_distribution_access,
// the general delete under dam_distribution_delete; should be dam_distribution_delete for both
// (ACL BE task #86852/3.10).
const canCancel = computed(() => can(ACL.DAM_DISTRIBUTION_ACCESS))
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
          v-if="item.status === DamDistributionStatus.Waiting && canCancel"
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
