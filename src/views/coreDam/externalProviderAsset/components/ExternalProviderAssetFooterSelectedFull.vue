<script setup lang="ts">
import { computed, watch } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import { useTheme } from '@anzusystems/common-admin'
import AssetFooterSelectedButtonClear from '@/views/coreDam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import { useExternalProviderAssetFooterSelectedView } from '@/composables/system/externalProviderAssetFooterSelected'
import ExternalProviderAssetQueueReadonly from '@/views/coreDam/externalProviderAsset/components/ExternalProviderAssetQueueReadonly.vue'
import { useExternalProviderAssetImport } from '@/views/coreDam/externalProviderAsset/composables/externalProviderAssetImport'
import { useExternalProviderAssetListStore } from '@/stores/coreDam/externalProviderAssetListStore'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
      <VToolbar
        class="w-100 system-border-b"
        :color="toolbarColor"
        density="compact"
        :height="64"
      >
        <div class="d-flex align-center pa-2">
          <div>
            <span class="text-subtitle-2">{{ t('coreDam.asset.selected.selectedFiles') }}: {{ queueTotalCount }}</span>
          </div>
        </div>
        <VSpacer />
        <div class="d-flex align-center">
          <VBtn
            color="primary"
            variant="flat"
            :height="36"
            class="mr-2"
            rounded="pill"
            @click.stop="onImport"
          >
            {{ t('coreDam.asset.selected.import') }} ({{ queueTotalCount }})
          </VBtn>
          <VBtn
            v-show="showMinimalSelected"
            icon
            variant="flat"
            :height="36"
            :width="36"
            rounded="circle"
            class="mr-2"
            @click.stop="setMinimalSelected"
          >
            <VIcon icon="mdi-chevron-down" />
          </VBtn>
          <AssetFooterSelectedButtonClear
            variant="normal"
            @confirm="onClearConfirm"
          />
        </div>
      </VToolbar>
      <ExternalProviderAssetQueueReadonly :queue-id="QUEUE_ID_MASS_EDIT" />
    </div>
  </div>
</template>
