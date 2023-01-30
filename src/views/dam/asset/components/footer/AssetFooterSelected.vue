<script setup lang="ts">
import { computed, watch } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_MASS_EDIT } from '@/services/upload/uploadQueueIds'
import AssetQueueMassEditSimple from '@/views/dam/asset/components/queue/AssetQueueSelectedSimple.vue'
import { useAssetListStore } from '@/stores/dam/assetListStore'
import AssetFooterSelectedButtonClear from '@/views/dam/asset/components/footer/AssetFooterSelectedButtonClear.vue'
import { useTheme } from '@/composables/system/themeSettings'
import { useI18n } from 'vue-i18n'
import { useAssetFooterSelectedView } from '@/composables/system/assetFooterSelected'

const { t } = useI18n({ useScope: 'global' })

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
            @click.stop="setFullSelected"
            color="primary"
            variant="flat"
            :height="26"
            class="mr-2"
          >
            {{ t('coreDam.asset.selected.edit') }}
          </VBtn>
          <AssetFooterSelectedButtonClear
            v-show="showFullSelected"
            @confirm="onClearConfirm"
            variant="small"
          ></AssetFooterSelectedButtonClear>
          <VBtn
            v-show="showMinimalSelected"
            icon
            @click.stop="setMinimalSelected"
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-2"
          >
            <VIcon icon="mdi-chevron-down"></VIcon>
            <VTooltip activator="parent" location="bottom">{{ t('common.modal.hide') }}</VTooltip>
          </VBtn>
          <VBtn
            v-show="showCompactSelected"
            icon
            @click.stop="setCompactSelected"
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-2"
          >
            <VIcon icon="mdi-chevron-up"></VIcon>
            <VTooltip activator="parent" location="bottom">{{ t('common.modal.show') }}</VTooltip>
          </VBtn>
        </div>
      </VToolbar>
      <AssetQueueMassEditSimple />
    </div>
  </div>
</template>
