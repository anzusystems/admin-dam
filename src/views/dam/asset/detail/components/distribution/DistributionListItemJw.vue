<script setup lang="ts">
import { computed } from 'vue'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import DistributionStatusChip from '@/views/dam/asset/detail/components/distribution/DistributionStatusChip.vue'
import { DistributionStatus } from '@/model/dam/valueObject/DistributionStatus'
import type { DistributionCustomItem, DistributionJwItem, DistributionYoutubeItem } from '@/types/dam/Distribution'
import type { DistributionServiceType } from '@/types/dam/DamConfig'
import { useI18n } from 'vue-i18n'

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
          Redistribute
        </VBtn>
      </VCol>
    </VRow>
    <VRow v-if="item.status === DistributionStatus.Distributed">
      <VCol>
        <a :href="'https://dashboard.jwplayer.com/#/content/detail?key=' + item.extId" target="_blank">
          {{ t('coreDam.jwDistribution.videoAdministrationLink') }}
        </a>
      </VCol>
    </VRow>
    <VRow v-else-if="item.status === DistributionStatus.Failed">
      <VCol>{{ t('coreDam.distribution.common.error') }}: {{ item.failReason }}</VCol>
    </VRow>
  </div>
</template>
