<script setup lang="ts">
import { AssetDetailTab } from '@/composables/system/assetDetailTab'
import { useI18n } from 'vue-i18n'
import ExternalProviderAssetMetadata
  from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetMetadata.vue'
import ExternalProviderAssetDetailSidebarActionsTeleportTarget
  from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetDetailSidebarActionsTeleportTarget.vue'

withDefaults(
  defineProps<{
    isVideo: boolean
    isAudio: boolean
    isImage: boolean
    isDocument: boolean
    // assetStatus: AssetStatus
  }>(),
  {}
)

const { t } = useI18n()
</script>

<template>
  <div class="sidebar-info d-flex w-100 h-100 flex-column">
    <div class="w-100 d-flex flex-column">
      <VTabs class="sidebar-info__tabs">
        <VTab :value="AssetDetailTab.Info">{{ t('coreDam.asset.detail.tabs.info') }}</VTab>
      </VTabs>

      <div class="sidebar-info__content">
        <div class="py-2">
          <ExternalProviderAssetMetadata detail-dialog />
        </div>
      </div>
      <div class="sidebar-info__actions px-2">
        <ExternalProviderAssetDetailSidebarActionsTeleportTarget />
      </div>
    </div>
  </div>
</template>
