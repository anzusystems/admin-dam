<script setup lang="ts">
import { useAssetFooterUploadView } from '@/composables/system/assetFooterUpload'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { computed, watch } from 'vue'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import { prettyBytes } from '@/utils/file'
import AssetFooterUploadButtonStop from '@/views/dam/asset/components/footer/AssetFooterUploadButtonStop.vue'
import AssetQueueUploadList from '@/views/dam/asset/components/queue/AssetQueueUploadList.vue'
import { useTheme } from '@/composables/system/themeSettings'
import { useI18n } from 'vue-i18n'

const { t } = useI18n({ useScope: 'global' })

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
  hideUpload,
} = useAssetFooterUploadView()
const uploadQueuesStore = useUploadQueuesStore()

const queueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_UPLOAD_GLOBAL)
})
const queueProcessedCount = computed(() => {
  return uploadQueuesStore.getQueueProcessedCount(QUEUE_ID_UPLOAD_GLOBAL)
})
const displaySpeed = computed(() => {
  if (uploadQueuesStore.uploadSpeed && uploadQueuesStore.uploadSpeed > 0) {
    return prettyBytes(uploadQueuesStore.uploadSpeed ? uploadQueuesStore.uploadSpeed : 0) + '/s'
  }
  return ''
})

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue > 0) {
    autoShowUpload()
  }
})

const onStopConfirm = () => {
  // todo clear html input file
  uploadQueuesStore.stopUpload(QUEUE_ID_UPLOAD_GLOBAL)
  hideUpload()
}

const isUploading = computed(() => {
  return queueTotalCount.value > queueProcessedCount.value
})
</script>

<template>
  <div class="asset-upload-overlay" :class="'asset-upload-overlay--' + footerViewUpload">
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
        <div class="d-flex align-center">
          <div class="text-caption mr-2 d-flex align-center" v-if="isUploading">
            <VProgressCircular indeterminate color="primary" size="16" width="2" class="mr-1"></VProgressCircular>
            <div>
              {{ queueProcessedCount + 1 }}/{{ queueTotalCount }}
              <span v-show="displaySpeed.length > 0">({{ displaySpeed }})</span>
            </div>
            <AssetFooterUploadButtonStop v-if="isUploading" @confirm="onStopConfirm" variant="small" />
          </div>
          <VBtn
            v-show="showMinimalUpload"
            icon
            @click.stop="setMinimalUpload"
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-2"
          >
            <VIcon icon="mdi-chevron-down"></VIcon>
            <VTooltip activator="parent" location="bottom">Hide</VTooltip>
          </VBtn>
          <VBtn
            v-show="showCompactUpload"
            icon
            @click.stop="setCompactUpload"
            variant="flat"
            :height="26"
            :width="26"
            rounded="circle"
            class="mr-2"
          >
            <VIcon icon="mdi-chevron-up"></VIcon>
            <VTooltip activator="parent" location="bottom">Show</VTooltip>
          </VBtn>
        </div>
      </VToolbar>
      <VToolbar class="w-100" :color="toolbarColor" density="compact" :height="48">
        <VSpacer></VSpacer>
        <div class="d-flex">
          <VBtn
            v-show="showFullUpload"
            @click.stop="setFullUpload"
            color="primary"
            variant="flat"
            :height="26"
            class="mr-2"
          >
            {{ t('coreDam.asset.upload.edit') }}
          </VBtn>
        </div>
      </VToolbar>
      <div class="asset-upload-overlay__content pa-2">
        <AssetQueueUploadList />
      </div>
    </div>
  </div>
</template>
