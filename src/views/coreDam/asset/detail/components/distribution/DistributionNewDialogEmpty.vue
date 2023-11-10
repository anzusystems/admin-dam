<script lang="ts" setup>
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/coreDam/DamConfig'
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import type { DocId } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    distributionServiceName: DistributionServiceName
    assetType: DamAssetType
    config: DistributionRequirementsConfig
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
