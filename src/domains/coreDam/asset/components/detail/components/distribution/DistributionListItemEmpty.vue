<script setup lang="ts">
import type {
  DistributionCustomItem,
  DistributionJwItem,
  DistributionYoutubeItem,
} from '@/domains/coreDam/asset/types/Distribution'
import type { DamAssetTypeType, DamDistributionServiceTypeType } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    item: DistributionJwItem | DistributionYoutubeItem | DistributionCustomItem
    assetType: DamAssetTypeType
    distributionType: DamDistributionServiceTypeType | null
    showRedistribute: boolean
  }>(),
  {}
)

const { t } = useI18n()
</script>

<template>
  <div class="text-body-medium">
    {{ t('coreDam.distribution.meta.unsupported') }}
  </div>
</template>
