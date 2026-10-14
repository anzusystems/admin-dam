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
  <!-- An asset being deleted is said to be so, whatever its main file: what became of the file matters no more. -->
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
  <!-- The server holds an asset as a draft until it has processed a file of it: also while its main file is on its
       way, or failed, or a duplicate. With a main file there is a file: what is said of it is its own state. -->
  <div
    v-else-if="assetStatus === DamAssetStatus.Draft && !assetMainFileStatus"
    class="w-100 pa-2 text-body-small"
  >
    <VAlert type="warning">
      {{ t('coreDam.asset.detail.info.status.draft') }}
    </VAlert>
  </div>
</template>
