<script lang="ts" setup>
import type {
  DamAssetTypeType,
  DamDistributionRequirementsConfig,
  DamDistributionServiceName,
} from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
    assetType: DamAssetTypeType
    config: DamDistributionRequirementsConfig
    assetId: DocId
  }>(),
  {}
)
defineEmits<{
  (e: 'closeDialog', reloadList: boolean): void
}>()

const { t } = useI18n()
</script>

<template>
  <div>{{ t('coreDam.distribution.meta.selectName') }}</div>
</template>
