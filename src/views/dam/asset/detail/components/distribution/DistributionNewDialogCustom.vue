<script lang="ts" setup>
import type { DistributionRequirementsConfig, DistributionServiceName } from '@/types/dam/DamConfig'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DocId } from '@/types/common'

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
  <div class="ma-2">Custom distribution coming soon</div>
</template>
