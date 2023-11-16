<script lang="ts" setup>
import { DamAssetStatus } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import AssetFileFailReasonChip from '@/views/coreDam/asset/components/AssetFileFailReasonChip.vue'
import { type AssetFileFailReason, AssetFileProcessStatus } from '@anzusystems/common-admin'

withDefaults(
  defineProps<{
    assetStatus: DamAssetStatus
    assetMainFileStatus?: AssetFileProcessStatus | undefined
    assetMainFileFailReason?: AssetFileFailReason | undefined
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
    class="w-100 pa-2 text-caption"
  >
    <VAlert
      dark
      type="warning"
    >
      {{ t('coreDam.asset.detail.info.status.duplicate') }}
    </VAlert>
  </div>
  <div
    v-if="assetMainFileStatus && assetMainFileStatus === AssetFileProcessStatus.Failed"
    class="w-100 pa-2 text-caption"
  >
    <VAlert
      dark
      type="error"
    >
      {{ t('coreDam.asset.detail.info.status.failed') }}
      <div v-if="assetMainFileFailReason">
        <br>
        <AssetFileFailReasonChip :reason="assetMainFileFailReason" />
      </div>
    </VAlert>
  </div>
  <div
    v-else-if="assetStatus === DamAssetStatus.Deleting"
    class="w-100 pa-2 text-caption"
  >
    <VAlert
      dark
      type="error"
    >
      {{ t('coreDam.asset.detail.info.status.deleting') }}
    </VAlert>
  </div>
  <div
    v-else-if="assetStatus === DamAssetStatus.Draft"
    class="w-100 pa-2 text-caption"
  >
    <VAlert
      dark
      type="warning"
    >
      {{ t('coreDam.asset.detail.info.status.draft') }}
    </VAlert>
  </div>
</template>
