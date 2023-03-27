<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import AssetQueueEditable from '@/views/coreDam/asset/components/queue/AssetQueueEditable.vue'
import { useAssetFooterUploadView } from '@/composables/system/assetFooterUpload'
import { bulkUpdateAssetsMetadata } from '@/services/api/coreDam/assetApi'
import AssetFooterUploadButtonStop from '@/views/coreDam/asset/components/footer/AssetFooterUploadButtonStop.vue'
import { useAlerts, useTheme } from '@anzusystems/common-admin'
import AssetUpload from '@/views/coreDam/asset/components/AssetUpload.vue'
import { useI18n } from 'vue-i18n'
import useVuelidate from '@vuelidate/core'
import { useAssetListActions } from '@/views/coreDam/asset/list/composables/assetListActions'

const { t } = useI18n()

const { toolbarColor } = useTheme()

const saveButtonLoading = ref(false)
const saveAndCloseButtonLoading = ref(false)

const { fetchAssetList } = useAssetListActions()

const { footerViewUpload, showMinimalUpload, setMinimalUpload, autoShowUpload, hideUpload } = useAssetFooterUploadView()
const uploadQueuesStore = useUploadQueuesStore()

const queueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_UPLOAD_GLOBAL)
})
const queueProcessedCount = computed(() => {
  return uploadQueuesStore.getQueueProcessedCount(QUEUE_ID_UPLOAD_GLOBAL)
})

watch(queueTotalCount, (newValue, oldValue) => {
  if (newValue !== oldValue && newValue > 0) {
    autoShowUpload()
  }
})

const massOperations = ref(true)

const list = computed(() => {
  return uploadQueuesStore.getQueueItems(QUEUE_ID_UPLOAD_GLOBAL)
})

const isUploading = computed(() => {
  return queueTotalCount.value > queueProcessedCount.value
})

const isFinished = computed(() => {
  return queueTotalCount.value === queueProcessedCount.value
})

const onStopConfirm = async () => {
  uploadQueuesStore.stopUpload(QUEUE_ID_UPLOAD_GLOBAL)
  hideUpload()
}

const toggleMassOperations = async () => {
  massOperations.value = !massOperations.value
}

const { showRecordWas, showValidationError, showErrorsDefault } = useAlerts()

const v$ = useVuelidate()

const onSave = async () => {
  if (list.value.length === 0) return
  saveButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveButtonLoading.value = false
    return
  }
  try {
    await bulkUpdateAssetsMetadata(list.value)
    fetchAssetList()
    showRecordWas('updated')
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saveButtonLoading.value = false
  }
}

const onSaveAndClose = async () => {
  if (list.value.length === 0) return
  saveAndCloseButtonLoading.value = true
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    saveAndCloseButtonLoading.value = false
    return
  }
  try {
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    await onStopConfirm()
    fetchAssetList()
  } catch (error) {
    showErrorsDefault(error)
  } finally {
    saveAndCloseButtonLoading.value = false
  }
}
</script>

<template>
  <div
    class="asset-footer__upload pa-0"
    :class="'asset-footer--' + footerViewUpload + ' asset-footer__upload--' + footerViewUpload"
  >
    <div class="d-flex w-100 h-100 flex-column">
      <VToolbar class="w-100 system-border-b" :color="toolbarColor" density="compact" :height="64">
        <div class="d-flex align-center px-2">
          <div>
            <div v-if="isUploading" class="text-subtitle-2 d-flex align-center">
              {{ t('coreDam.asset.upload.title') }}
            </div>
            <div v-else class="text-subtitle-2 d-flex align-center text-green-darken-3 font-weight-bold">
              {{ t('coreDam.asset.upload.titleDone') }}
            </div>
          </div>
        </div>
        <VSpacer />
        <div v-if="isUploading" class="text-caption d-flex align-center">
          <VProgressCircular indeterminate color="primary" size="16" width="2" class="mr-1" />
          <div>{{ t('coreDam.asset.upload.uploading') }} {{ queueProcessedCount + 1 }}/{{ queueTotalCount }}</div>
        </div>
        <div class="d-flex align-center">
          <VDivider v-show="isUploading" vertical class="mx-4 my-2" />
          <VBtn
            v-if="isFinished"
            color="success"
            variant="flat"
            :height="36"
            class="mr-2"
            rounded="pill"
            :loading="saveAndCloseButtonLoading"
            :disabled="saveButtonLoading"
            @click.stop="onSaveAndClose"
          >
            {{ t('coreDam.asset.upload.saveAndClose') }}
          </VBtn>
          <VBtn
            variant="flat"
            :height="36"
            :width="36"
            class="mr-2"
            icon
            color="secondary"
            :loading="saveButtonLoading"
            :disabled="saveAndCloseButtonLoading"
            @click.stop="onSave"
          >
            <VIcon icon="mdi-content-save" />
            <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.upload.save') }}</VTooltip>
          </VBtn>
          <AssetUpload :height="36" variant="icon" />
          <VDivider vertical class="mx-4 my-2" />
          <VBtn
            :height="36"
            :width="36"
            :active="massOperations"
            :variant="massOperations ? 'flat' : 'text'"
            :color="massOperations ? 'secondary' : ''"
            class="mr-2"
            icon
            @click.stop="toggleMassOperations"
          >
            <VIcon icon="mdi-tag-text-outline" />
            <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.massOperations.title') }}</VTooltip>
          </VBtn>
          <VBtn
            v-show="showMinimalUpload"
            icon
            variant="flat"
            :height="36"
            :width="36"
            rounded="circle"
            class="mr-2"
            @click.stop="setMinimalUpload"
          >
            <VIcon icon="mdi-chevron-down" />
            <VTooltip activator="parent" location="bottom">{{ t('common.system.modal.hide') }}</VTooltip>
          </VBtn>
          <AssetFooterUploadButtonStop :button-size="36" :is-uploading="isUploading" @confirm="onStopConfirm" />
        </div>
      </VToolbar>
      <AssetQueueEditable :queue-id="QUEUE_ID_UPLOAD_GLOBAL" :mass-operations="massOperations" />
    </div>
    <AssetUpload />
  </div>
</template>
