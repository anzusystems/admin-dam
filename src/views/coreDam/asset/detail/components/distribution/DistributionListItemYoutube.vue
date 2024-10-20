<script setup lang="ts">
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'
import { damClient } from '@/services/api/clients/damClient'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import DistributionFailReasonChip from '@/views/coreDam/asset/detail/components/distribution/DistributionFailReasonChip.vue'
import DistributionStatusChip from '@/views/coreDam/asset/detail/components/distribution/DistributionStatusChip.vue'
import { type DamAssetTypeType, type DamDistributionServiceTypeType, DamDistributionStatus, isUndefined, useDamConfigState } from '@anzusystems/common-admin'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
  return configExtSystem[props.assetType].distribution.distributionRequirements[props.item.distributionService]
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
