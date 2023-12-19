<script lang="ts" setup>
import type {
  DamAssetType,
  DamDistributionRequirementsConfig,
  DamDistributionServiceName,
  DocId,
} from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    distributionServiceName: DamDistributionServiceName
    assetType: DamAssetType
    config: DamDistributionRequirementsConfig
    assetId: DocId
  }>(),
  {}
)
defineEmits<{
  (e: 'closeDialog', reloadList: boolean): void
}>()
</script>

<template>
  <div>Please select distribution name</div>
</template>
