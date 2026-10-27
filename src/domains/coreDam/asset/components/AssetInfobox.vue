<script lang="ts" setup>
import { ADamAssetFileFailReasonChip, AssetFileProcessStatus, DamAssetStatus } from '@anzusystems/common-admin'
import type { AssetFileFailReasonType, AssetFileProcessStatusType, DamAssetStatusType } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

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
  <!-- A deleting asset shows only that state, whatever its main file status. -->
  <div
    v-if="assetStatus === DamAssetStatus.Deleting"
    class="w-100 pa-2 text-body-small"
  >
    <VAlert type="error">
      {{ t('coreDam.asset.detail.info.status.deleting') }}
    </VAlert>
  </div>
  <div
    v-else-if="assetMainFileStatus && assetMainFileStatus === AssetFileProcessStatus.Duplicate"
    class="w-100 pa-2 text-body-small"
  >
    <VAlert type="warning">
      {{ t('coreDam.asset.detail.info.status.duplicate') }}
    </VAlert>
  </div>
  <div
    v-else-if="assetMainFileStatus && assetMainFileStatus === AssetFileProcessStatus.Failed"
    class="w-100 pa-2 text-body-small"
  >
    <VAlert type="error">
      {{ t('coreDam.asset.detail.info.status.failed') }}
      <div v-if="assetMainFileFailReason">
        <br />
        <ADamAssetFileFailReasonChip :reason="assetMainFileFailReason" />
      </div>
    </VAlert>
  </div>
  <!--
    The server keeps an asset as draft until it processed a file,
    also while the main file is uploading, failed or is a duplicate.
    With a main file, the file's own state is shown instead.
  -->
  <div
    v-else-if="assetStatus === DamAssetStatus.Draft && !assetMainFileStatus"
    class="w-100 pa-2 text-body-small"
  >
    <VAlert type="warning">
      {{ t('coreDam.asset.detail.info.status.draft') }}
    </VAlert>
  </div>
</template>
