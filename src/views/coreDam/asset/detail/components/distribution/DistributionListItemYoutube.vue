<script setup lang="ts">
import { computed } from 'vue'
import { type DamDistributionServiceType, isUndefined } from '@anzusystems/common-admin'
import { type DamAssetType, DamDistributionStatus, useDamConfigState } from '@anzusystems/common-admin'
import DistributionStatusChip from '@/views/coreDam/asset/detail/components/distribution/DistributionStatusChip.vue'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import { useI18n } from 'vue-i18n'
import DistributionFailReasonChip from '@/views/coreDam/asset/detail/components/distribution/DistributionFailReasonChip.vue'
import { useCurrentExtSystem } from '@/composables/system/currentExtSystem'

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

const { getDamConfigExtSystem } = useDamConfigState()
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
