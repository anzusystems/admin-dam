<script setup lang="ts">
import { computed, watch } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import { useTheme } from '@/composables/system/themeSettings'
import AssetFooterSelectedButtonClear from '@/views/dam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import { useExternalProviderAssetFooterSelectedView } from '@/composables/system/externalProviderAssetFooterSelected'
import ExternalProviderAssetQueueReadonly from '@/views/dam/externalProviderAsset/components/ExternalProviderAssetQueueReadonly.vue'
import { useExternalProviderAssetImport } from '@/views/dam/externalProviderAsset/composables/externalProviderAssetImport'
import { useExternalProviderAssetListStore } from '@/stores/dam/externalProviderAssetListStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

const { toolbarColor } = useTheme()

const { externalProviderFooterViewSelected, showMinimalSelected, setMinimalSelected, autoShowSelected, hideSelected } =
  useExternalProviderAssetFooterSelectedView()

const assetListStore = useExternalProviderAssetListStore()
const uploadQueuesStore = useUploadQueuesStore()

const queueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT)
})

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue > 0) {
    autoShowSelected()
  }
})

const onClearConfirm = async () => {
  uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
  assetListStore.clearSelected()
  hideSelected()
}

const { importFromSelected } = useExternalProviderAssetImport()

const onImport = () => {
  importFromSelected()
}
</script>

<template>
  <div
    class="asset-footer__selected pa-0"
    :class="
      'asset-footer--' +
      externalProviderFooterViewSelected +
      ' asset-footer__selected--' +
      externalProviderFooterViewSelected
    "
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar class="w-100 system-border-b" :color="toolbarColor" density="compact" :height="64">
        <div class="d-flex align-center pa-2">
          <div>
            <span class="text-subtitle-2">{{ t('coreDam.asset.selected.selectedFiles') }}: {{ queueTotalCount }}</span>
          </div>
        </div>
        <VSpacer />
        <div class="d-flex align-center">
          <VBtn @click.stop="onImport" color="primary" variant="flat" :height="36" class="mr-2" rounded="pill">
            {{ t('coreDam.asset.selected.import') }} ({{ queueTotalCount }})
          </VBtn>
          <AssetFooterSelectedButtonClear @confirm="onClearConfirm" variant="normal" />
          <VDivider vertical class="mx-4 my-2" />
          <VBtn
            v-show="showMinimalSelected"
            icon
            @click.stop="setMinimalSelected"
            variant="flat"
            :height="36"
            :width="36"
            rounded="circle"
            class="mr-2"
          >
            <VIcon icon="mdi-chevron-down" />
          </VBtn>
        </div>
      </VToolbar>
      <ExternalProviderAssetQueueReadonly :queue-id="QUEUE_ID_MASS_EDIT" />
    </div>
  </div>
</template>
