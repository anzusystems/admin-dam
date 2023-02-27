<script lang="ts" setup>
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import { useI18n } from 'vue-i18n'
import { AssetFileProcessStatus } from '@/types/coreDam/File'

withDefaults(
  defineProps<{
    assetStatus: AssetStatus
    assetMainFileStatus?: AssetFileProcessStatus
  }>(),
  {
    assetMainFileStatus: undefined,
  }
)

const { t } = useI18n()
</script>

<template>
  <div
    v-if="assetMainFileStatus && assetMainFileStatus === AssetFileProcessStatus.Duplicate"
    class="w-100 pa-2 text-caption"
  >
    <VAlert dark type="warning">{{ t('coreDam.asset.detail.info.status.duplicate') }}</VAlert>
  </div>
  <div v-else-if="assetStatus === AssetStatus.Deleting" class="w-100 pa-2 text-caption">
    <VAlert dark type="error">{{ t('coreDam.asset.detail.info.status.deleting') }}</VAlert>
  </div>
  <div v-else-if="assetStatus === AssetStatus.Draft" class="w-100 pa-2 text-caption">
    <VAlert dark type="warning">{{ t('coreDam.asset.detail.info.status.draft') }}</VAlert>
  </div>
</template>
