<script lang="ts" setup>
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/coreDam/DamConfig'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { DocId } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    distributionServiceName: DistributionServiceName
    assetType: AssetType
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
