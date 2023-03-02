<script setup lang="ts">
import { computed, watch } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import AssetQueueMassEditSimple from '@/views/coreDam/asset/components/queue/AssetQueueSelectedSimple.vue'
import { useAssetListStore } from '@/stores/coreDam/assetListStore'
import AssetFooterSelectedButtonClear from '@/views/coreDam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import { useTheme } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'
import { useAssetFooterSelectedView } from '@/composables/system/assetFooterSelected'

const { t } = useI18n()

const { toolbarColor } = useTheme()

const {
  autoShowSelected,
  hideSelected,
  footerViewSelected,
  showFullSelected,
  setFullSelected,
  showMinimalSelected,
  setMinimalSelected,
  showCompactSelected,
  setCompactSelected,
} = useAssetFooterSelectedView()
const uploadQueuesStore = useUploadQueuesStore()
const assetListStore = useAssetListStore()

const queueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_MASS_EDIT)
})

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue === oldValue) return
  if (newValue > 0) {
    autoShowSelected()
    return
  }
  if (newValue === 0) {
    hideSelected()
    return
  }
})

const onClearConfirm = async () => {
  uploadQueuesStore.clearQueue(QUEUE_ID_MASS_EDIT)
  assetListStore.clearSelected()
  hideSelected()
}
</script>

<template>
  <div
    class="asset-footer__selected pa-0"
    :class="'asset-footer--' + footerViewSelected + ' asset-footer__selected--' + footerViewSelected"
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar class="w-100" :color="toolbarColor" density="compact" :height="48">
        <div class="d-flex px-2">
          <div>
            <span class="text-caption font-weight-bold">
              {{ t('coreDam.asset.selected.selectedFiles') }}: {{ queueTotalCount }}
            </span>
          </div>
        </div>
        <VSpacer />
        <div class="d-flex">
          <VBtn
            v-show="showFullSelected"
            color="primary"
            variant="flat"
            :height="26"
            class="mr-2"
            @click.stop="setFullSelected"
          >
            {{ t('coreDam.asset.selected.edit') }}
          </VBtn>
          <AssetFooterSelectedButtonClear v-show="showFullSelected" variant="small" @confirm="onClearConfirm" />
          <VBtn
            v-show="showMinimalSelected"
            icon
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-2"
            @click.stop="setMinimalSelected"
          >
            <VIcon icon="mdi-chevron-down" />
            <VTooltip activator="parent" location="bottom">{{ t('common.system.modal.hide') }}</VTooltip>
          </VBtn>
          <VBtn
            v-show="showCompactSelected"
            icon
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-2"
            @click.stop="setCompactSelected"
          >
            <VIcon icon="mdi-chevron-up" />
            <VTooltip activator="parent" location="bottom">{{ t('common.system.modal.show') }}</VTooltip>
          </VBtn>
        </div>
      </VToolbar>
      <AssetQueueMassEditSimple />
    </div>
  </div>
</template>
