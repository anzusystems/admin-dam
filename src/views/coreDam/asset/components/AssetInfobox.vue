<script lang="ts" setup>
import AssetFileFailReasonChip from '@/views/coreDam/asset/components/AssetFileFailReasonChip.vue'
import {
  type AssetFileFailReasonType,
  AssetFileProcessStatus,
  type AssetFileProcessStatusType,
  DamAssetStatus,
  type DamAssetStatusType,
} from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    assetStatus: DamAssetStatusType
    assetMainFileStatus?: AssetFileProcessStatusType | undefined
    assetMainFileFailReason?: AssetFileFailReasonType | undefined
  }>(),
  {
    assetMainFileStatus: undefined,
    assetMainFileFailReason: undefined,
  }
)

const { t } = useI18n()
</script>

<template>
  <div
    v-if="assetMainFileStatus && assetMainFileStatus === AssetFileProcessStatus.Duplicate"
    class="w-100 pa-2 text-body-small"
  >
    <VAlert type="warning">
      {{ t('coreDam.asset.detail.info.status.duplicate') }}
    </VAlert>
  </div>
  <div
    v-if="assetMainFileStatus && assetMainFileStatus === AssetFileProcessStatus.Failed"
    class="w-100 pa-2 text-body-small"
  >
    <VAlert type="error">
      {{ t('coreDam.asset.detail.info.status.failed') }}
      <div v-if="assetMainFileFailReason">
        <br />
        <AssetFileFailReasonChip :reason="assetMainFileFailReason" />
      </div>
    </VAlert>
  </div>
  <div v-else-if="assetStatus === DamAssetStatus.Deleting" class="w-100 pa-2 text-body-small">
    <VAlert type="error">
      {{ t('coreDam.asset.detail.info.status.deleting') }}
    </VAlert>
  </div>
  <div v-else-if="assetStatus === DamAssetStatus.Draft" class="w-100 pa-2 text-body-small">
    <VAlert type="warning">
      {{ t('coreDam.asset.detail.info.status.draft') }}
    </VAlert>
  </div>
</template>
