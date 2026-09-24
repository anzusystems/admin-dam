<script setup lang="ts">
import { DamDistributionStatus, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import type { DamAssetTypeType, DamDistributionServiceTypeType } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DistributionFailReasonChip from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionFailReasonChip.vue'
import DistributionStatusChip from '@/domains/coreDam/asset/components/detail/components/distribution/DistributionStatusChip.vue'
import { useCurrentExtSystem } from '@/domains/coreDam/asset/composables/currentExtSystem'
import type {
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
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
          :href="'https://www.youtube.com/watch?v=' + item.extId"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('coreDam.youtubeDistribution.videoPreviewLink') }}
        </a>
        <br />
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
