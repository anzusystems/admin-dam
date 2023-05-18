<script setup lang="ts">
import { useAssetFooterUploadView } from '@/composables/system/assetFooterUpload'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { computed, watch } from 'vue'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import AssetQueueUploadList from '@/views/coreDam/asset/components/queue/AssetQueueUploadList.vue'
import { useTheme } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { toolbarColor } = useTheme()

const {
  footerViewUpload,
  showFullUpload,
  setFullUpload,
  showCompactUpload,
  setCompactUpload,
  showMinimalUpload,
  setMinimalUpload,
  autoShowUpload,
} = useAssetFooterUploadView()
const uploadQueuesStore = useUploadQueuesStore()

const queueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_UPLOAD_GLOBAL)
})
const queueProcessedCount = computed(() => {
  return uploadQueuesStore.getQueueProcessedCount(QUEUE_ID_UPLOAD_GLOBAL)
})

const uploadSpeed = computed(() => {
  return uploadQueuesStore.uploadSpeed
})

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue > 0) {
    autoShowUpload()
  }
})

const isUploading = computed(() => {
  return queueTotalCount.value > queueProcessedCount.value
})
</script>

<template>
  <div
    class="asset-upload-overlay"
    :class="'asset-upload-overlay--' + footerViewUpload"
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar
        class="w-100"
        :color="toolbarColor"
        density="compact"
        :height="48"
      >
        <div class="d-flex px-2">
          <div class="d-flex align-center">
            <div
              v-if="isUploading"
              class="text-caption d-flex align-center font-weight-bold"
            >
              {{ t('coreDam.asset.upload.title') }}
            </div>
            <div
              v-else
              class="text-caption d-flex align-center text-green-darken-3 font-weight-bold"
            >
              {{ t('coreDam.asset.upload.titleDone') }}
            </div>
          </div>
        </div>
        <VSpacer />
        <div class="d-flex align-center pr-1">
          <div
            v-if="isUploading"
            class="text-caption mr-2 d-flex align-center"
          >
            <div>
              Remaing time {{ uploadQueuesStore.totalSizeToUpload }}
            </div>
<!--            <div>-->
<!--              Upload speed {{ uploadSpeed }}-->
<!--            </div>-->
            <VProgressCircular
              indeterminate
              color="primary"
              size="16"
              width="2"
              class="mr-1"
            />
            <div>{{ queueProcessedCount + 1 }}/{{ queueTotalCount }}</div>
          </div>
          <VBtn
            v-show="showMinimalUpload"
            icon
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-1"
            @click.stop="setMinimalUpload"
          >
            <VIcon icon="mdi-chevron-down" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.system.modal.hide') }}
            </VTooltip>
          </VBtn>
          <VBtn
            v-show="showCompactUpload"
            icon
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-1"
            @click.stop="setCompactUpload"
          >
            <VIcon icon="mdi-chevron-up" />
            <VTooltip
              activator="parent"
              location="bottom"
            >
              {{ t('common.system.modal.show') }}
            </VTooltip>
          </VBtn>
        </div>
      </VToolbar>
      <VToolbar
        class="w-100"
        :color="toolbarColor"
        density="compact"
        :height="48"
      >
        <div class="ml-2 text-caption">
          {{ t('coreDam.asset.upload.newAssetsUploadOverlayTitle') }}
        </div>
        <VSpacer />
        <div class="d-flex">
          <VBtn
            v-show="showFullUpload"
            color="primary"
            variant="flat"
            :height="26"
            class="mr-2"
            @click.stop="setFullUpload"
          >
            {{ t('coreDam.asset.upload.edit') }}
          </VBtn>
        </div>
      </VToolbar>
      <div class="asset-upload-overlay__content pa-2">
        <AssetQueueUploadList :queue-id="QUEUE_ID_UPLOAD_GLOBAL" />
      </div>
    </div>
  </div>
</template>
