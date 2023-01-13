<script setup lang="ts">
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { computed, watch } from 'vue'
import { QUEUE_ID_UPLOAD_SLOTS } from '@/services/upload/uploadQueueIds'
import AssetFooterUploadButtonStop from '@/views/dam/asset/components/footer/AssetFooterUploadButtonStop.vue'
import AssetQueueUploadList from '@/views/dam/asset/components/queue/AssetQueueUploadList.vue'
import { useTheme } from '@/composables/system/themeSettings'
import { useI18n } from 'vue-i18n'
import { useAssetFooterUploadSlotsView } from '@/composables/system/assetFooterUploadSlots'

const { t } = useI18n({ useScope: 'global' })

const { toolbarColor } = useTheme()

const {
  footerViewUploadSlots,
  showCompactUpload,
  setCompactUpload,
  showMinimalUpload,
  setMinimalUpload,
  autoShowUpload,
  hideUpload,
} = useAssetFooterUploadSlotsView()
const uploadQueuesStore = useUploadQueuesStore()

const queueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_UPLOAD_SLOTS)
})
const queueProcessedCount = computed(() => {
  return uploadQueuesStore.getQueueProcessedCount(QUEUE_ID_UPLOAD_SLOTS)
})

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue > 0) {
    autoShowUpload()
  }
})

const onStopConfirm = () => {
  uploadQueuesStore.stopUpload(QUEUE_ID_UPLOAD_SLOTS)
  hideUpload()
}

const isUploading = computed(() => {
  return queueTotalCount.value > queueProcessedCount.value
})
</script>

<template>
  <div
    class="asset-upload-overlay asset-upload-overlay--slots"
    :class="'asset-upload-overlay--' + footerViewUploadSlots"
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar class="w-100" :color="toolbarColor" density="compact" :height="48">
        <div class="d-flex px-2">
          <div class="d-flex align-center">
            <div class="text-caption d-flex align-center font-weight-bold" v-if="isUploading">
              {{ t('coreDam.asset.upload.title') }}
            </div>
            <div class="text-caption d-flex align-center text-green-darken-3 font-weight-bold" v-else>
              {{ t('coreDam.asset.upload.titleDone') }}
            </div>
          </div>
        </div>
        <VSpacer></VSpacer>
        <div class="d-flex align-center pr-1">
          <div class="text-caption mr-2 d-flex align-center" v-if="isUploading">
            <VProgressCircular indeterminate color="primary" size="16" width="2" class="mr-1"></VProgressCircular>
            <div>{{ queueProcessedCount + 1 }}/{{ queueTotalCount }}</div>
          </div>
          <VBtn
            v-show="showMinimalUpload"
            icon
            @click.stop="setMinimalUpload"
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-1"
          >
            <VIcon icon="mdi-chevron-down"></VIcon>
            <VTooltip activator="parent" location="bottom">{{ t('common.modal.hide') }}</VTooltip>
          </VBtn>
          <VBtn
            v-show="showCompactUpload"
            icon
            @click.stop="setCompactUpload"
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-1"
          >
            <VIcon icon="mdi-chevron-up" />
            <VTooltip activator="parent" location="bottom">{{ t('common.modal.show') }}</VTooltip>
          </VBtn>
          <AssetFooterUploadButtonStop @confirm="onStopConfirm" :is-uploading="isUploading" />
        </div>
      </VToolbar>
      <VToolbar class="w-100" :color="toolbarColor" density="compact" :height="48">
        <VSpacer></VSpacer>
        <div class="d-flex">
          <VBtn
            v-show="!isUploading"
            @click.stop="onStopConfirm"
            color="primary"
            variant="flat"
            :height="26"
            class="mr-2"
          >
            {{ t('coreDam.asset.upload.clear') }}
          </VBtn>
        </div>
      </VToolbar>
      <div class="asset-upload-overlay__content pa-2">
        <AssetQueueUploadList :queue-id="QUEUE_ID_UPLOAD_SLOTS" />
      </div>
    </div>
  </div>
</template>
