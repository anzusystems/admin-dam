<script lang="ts" setup>
import type { DamDistributionServiceName } from '@anzusystems/common-admin'
import type { DamDistributionRequirementsConfig } from '@anzusystems/common-admin'
import type { DamAssetType } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'

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
