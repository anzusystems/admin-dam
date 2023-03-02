<script setup lang="ts">
import { computed } from 'vue'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import DistributionStatusChip from '@/views/coreDam/asset/detail/components/distribution/DistributionStatusChip.vue'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/coreDam/Distribution'
import type { DistributionServiceType } from '@/types/coreDam/DamConfig'
import { useI18n } from 'vue-i18n'
import { DistributionStatus } from '@/model/coreDam/valueObject/DistributionStatus'
import DistributionFailReasonChip from '@/views/coreDam/asset/detail/components/distribution/DistributionFailReasonChip.vue'
import DistributionListItemCustomDistributionDataItem from '@/views/coreDam/asset/detail/components/distribution/DistributionListItemCustomDistributionDataItem.vue'

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
  <div v-if="serviceRequirements" class="text-body-2">
    <VRow>
      <VCol>
        <div class="font-weight-bold">{{ serviceRequirements.title }}</div>
      </VCol>
    </VRow>
    <VRow>
      <VCol>
        {{ t('coreDam.distribution.common.status') }}: <DistributionStatusChip :status="item.status" />
        <VBtn
          v-if="showRedistribute"
          class="ml-2"
          variant="flat"
          color="secondary"
          size="small"
          @click.stop="emit('openRedistribute')"
        >
          {{ t('coreDam.distribution.common.redistributeButton') }}
        </VBtn>
      </VCol>
    </VRow>
    <VRow v-if="item.status === DistributionStatus.Failed">
      <VCol>
        {{ t('coreDam.distribution.common.failReason') }}: <DistributionFailReasonChip :status="item.failReason" />
      </VCol>
    </VRow>
    <VRow>
      <VCol v-if="item.extId.length > 0">{{ t('coreDam.distribution.common.extId') }}: {{ item.extId }}</VCol>
      <VCol v-for="(value, key) in item.distributionData" :key="key">
        <DistributionListItemCustomDistributionDataItem :item="value" :title="key" />
      </VCol>
    </VRow>
  </div>
</template>
