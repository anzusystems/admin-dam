<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import AssetQueueEditable from '@/views/dam/asset/components/queue/AssetQueueEditable.vue'
import { useAssetFooterUploadView } from '@/composables/system/assetFooterUpload'
import { bulkUpdateAssetsMetadata } from '@/services/api/dam/assetApi'
import AssetFooterUploadButtonStop from '@/views/dam/asset/components/footer/AssetFooterUploadButtonStop.vue'
import { useTheme } from '@/composables/system/themeSettings'
import AssetUpload from '@/views/dam/asset/components/AssetUpload.vue'
import { useAlerts } from '@/composables/system/alerts'
import { useErrorHandler } from '@/composables/system/error'
import { useUiHelper } from '@/composables/system/uiHelper'
import { useI18n } from 'vue-i18n'
import useVuelidate from '@vuelidate/core'
import { useAssetListActions } from '@/views/dam/asset/list/composables/assetListActions'

const { t } = useI18n({ useScope: 'global' })

const { toolbarColor } = useTheme()

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

const { showRecordWas, showValidationError } = useAlerts()
const { handleError } = useErrorHandler()
const { btn, btnReset, btnLoadingOn, btnDisable, btnEnable } = useUiHelper()

const v$ = useVuelidate()

const onSave = async () => {
  if (list.value.length === 0) return
  btnDisable('save', 'saveAndClose')
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    btnEnable('save', 'saveAndClose')
    return
  }
  try {
    btnLoadingOn('save')
    btnDisable('saveAndClose')
    await bulkUpdateAssetsMetadata(list.value)
    fetchAssetList()
    showRecordWas('updated')
  } catch (error) {
    handleError(error)
  } finally {
    btnReset('save', 'saveAndClose')
  }
}

const onSaveAndClose = async () => {
  if (list.value.length === 0) return
  btnDisable('save', 'saveAndClose')
  v$.value.$touch()
  if (v$.value.$invalid) {
    showValidationError()
    btnEnable('save', 'saveAndClose')
    return
  }
  try {
    btnLoadingOn('saveAndClose')
    btnDisable('save')
    await bulkUpdateAssetsMetadata(list.value)
    showRecordWas('updated')
    await onStopConfirm()
    fetchAssetList()
  } catch (error) {
    handleError(error)
  } finally {
    btnReset('save', 'saveAndClose')
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
            <div class="text-subtitle-2 d-flex align-center" v-if="isUploading">
              {{ t('coreDam.asset.upload.title') }}
            </div>
            <div class="text-subtitle-2 d-flex align-center text-green-darken-3 font-weight-bold" v-else>
              {{ t('coreDam.asset.upload.titleDone') }}
            </div>
          </div>
        </div>
        <VSpacer></VSpacer>
        <div class="text-caption d-flex align-center" v-if="isUploading">
          <VProgressCircular indeterminate color="primary" size="16" width="2" class="mr-1"></VProgressCircular>
          <div>{{ t('coreDam.asset.upload.uploading') }} {{ queueProcessedCount + 1 }}/{{ queueTotalCount }}</div>
        </div>
        <div class="d-flex align-center">
          <VDivider v-show="isUploading" vertical class="mx-4 my-2" />
          <VBtn
            v-if="isFinished"
            @click.stop="onSaveAndClose"
            color="success"
            variant="flat"
            :height="36"
            class="mr-2"
            rounded="pill"
            :loading="btn.saveAndClose.loading"
            :disabled="btn.saveAndClose.disabled"
          >
            {{ t('coreDam.asset.upload.saveAndClose') }}
          </VBtn>
          <VBtn
            @click.stop="onSave"
            variant="flat"
            :height="36"
            :width="36"
            class="mr-2"
            icon
            color="secondary"
            :loading="btn.save.loading"
            :disabled="btn.save.disabled"
          >
            <VIcon icon="mdi-content-save" />
            <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.upload.save') }}</VTooltip>
          </VBtn>
          <AssetUpload :height="36" variant="icon" />
          <VDivider vertical class="mx-4 my-2" />
          <VBtn
            @click.stop="toggleMassOperations"
            :height="36"
            :width="36"
            :active="massOperations"
            :variant="massOperations ? 'flat' : 'text'"
            :color="massOperations ? 'secondary' : ''"
            class="mr-2"
            icon
          >
            <VIcon icon="mdi-tag-text-outline" />
            <VTooltip activator="parent" location="bottom">{{ t('coreDam.asset.massOperations.title') }}</VTooltip>
          </VBtn>
          <VBtn
            v-show="showMinimalUpload"
            icon
            @click.stop="setMinimalUpload"
            variant="flat"
            :height="36"
            :width="36"
            rounded="circle"
            class="mr-2"
          >
            <VIcon icon="mdi-chevron-down"></VIcon>
            <VTooltip activator="parent" location="bottom">{{ t('common.modal.hide') }}</VTooltip>
          </VBtn>
          <AssetFooterUploadButtonStop @confirm="onStopConfirm" :button-size="36" :is-uploading="isUploading" />
        </div>
      </VToolbar>
      <AssetQueueEditable :queue-id="QUEUE_ID_UPLOAD_GLOBAL" :mass-operations="massOperations"></AssetQueueEditable>
    </div>
    <AssetUpload />
  </div>
</template>
