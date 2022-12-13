<script lang="ts" setup>
import { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    assetStatus: AssetStatus
  }>(),
  {}
)

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div class="w-100 pa-2 text-caption" v-if="assetStatus === AssetStatus.Deleting">
    <VAlert dark type="error">{{ t('coreDam.asset.detail.info.status.deleting') }}</VAlert>
  </div>
  <div class="w-100 pa-2 text-caption" v-if="assetStatus === AssetStatus.Draft">
    <VAlert dark type="warning">{{ t('coreDam.asset.detail.info.status.draft') }}</VAlert>
  </div>
</template>
