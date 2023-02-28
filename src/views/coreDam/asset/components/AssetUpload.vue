<script setup lang="ts">
import FileUpload from '@/components/coreDam/FileUpload.vue'
import { useUploadQueuesStore } from '@/stores/coreDam/uploadQueuesStore'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import { computed, ref } from 'vue'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { DocId } from '@anzusystems/common-admin'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    variant?: 'dropzone-fullscreen' | 'button' | 'icon' | 'slot-upload'
    type?: 'default' | 'slots'
    buttonText?: string
    height?: number
    queueId?: string
    assetId?: DocId
    slotName?: string
    multiple?: boolean
    assetType?: AssetType
  }>(),
  {
    variant: 'dropzone-fullscreen',
    type: 'default',
    buttonText: '',
    height: undefined,
    queueId: QUEUE_ID_UPLOAD_GLOBAL,
    assetId: undefined,
    slotName: undefined,
    multiple: true,
    assetType: undefined,
  }
)

const fileCache = ref<File[]>([])
const uploadDialog = ref(false)
const uploadDialogLoader = ref(false)

const uploadQueuesStore = useUploadQueuesStore()
const { maxUploadItems } = useBetaTestFeatures()

const assetUpload = async (files: File[]) => {
  fileCache.value = files
  if (files.length + uploadQueueTotalCount.value > maxUploadItems.value) {
    openDialog()
    return
  }
  if (props.type === 'slots' && props.assetId && props.slotName && props.assetType) {
    // todo add check by type for slot uploads
    await uploadQueuesStore.addByFilesAsSlotUpload(props.queueId, files, props.assetId, props.slotName, props.assetType)
    fileCache.value = []
    return
  } else if (props.type === 'default') {
    await uploadQueuesStore.addByFiles(props.queueId, files)
    fileCache.value = []
    return
  }
  console.error('Unsupported upload setup.')
}

const fileInputKey = computed(() => {
  return uploadQueuesStore.getQueueFileInputKey(props.queueId)
})

const uploadQueueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(props.queueId)
})

const alreadyAtUploadLimit = computed(() => {
  return uploadQueueTotalCount.value === maxUploadItems.value
})

const openDialog = () => {
  uploadDialog.value = true
}

const onDialogCancel = () => {
  fileCache.value = []
  uploadQueuesStore.forceReloadFileInput(props.queueId)
  uploadDialog.value = false
}

const onDialogConfirm = async () => {
  uploadDialogLoader.value = true
  const files = fileCache.value.slice(0, maxUploadItems.value - uploadQueueTotalCount.value)
  await uploadQueuesStore.addByFiles(props.queueId, files)
  fileCache.value = []
  uploadDialogLoader.value = false
  uploadDialog.value = false
}

const createSizesByAssetType = (assetType: AssetType) => {
  const sizes: Record<string, number> = {}
  for (let i = 0; i < damConfigExtSystem[assetType].mimeTypes.length; i++) {
    sizes[damConfigExtSystem[assetType].mimeTypes[i]] = damConfigExtSystem[assetType].sizeLimit
  }
  return sizes
}

const uploadSizes = computed(() => {
  if (props.assetType) {
    return {
      ...createSizesByAssetType(props.assetType),
    }
  }
  return {
    ...createSizesByAssetType(AssetType.Image),
    ...createSizesByAssetType(AssetType.Audio),
    ...createSizesByAssetType(AssetType.Video),
    ...createSizesByAssetType(AssetType.Document),
  }
})

const uploadAccept = computed(() => {
  return Object.keys(uploadSizes.value).join(',')
})

const { t } = useI18n()
</script>

<template>
  <FileUpload
    :variant="variant"
    :button-text="buttonText"
    :height="height"
    :file-input-key="fileInputKey"
    :accept="uploadAccept"
    :max-sizes="uploadSizes"
    :multiple="multiple"
    @files-input="assetUpload"
  />
  <VDialog v-model="uploadDialog" persistent no-click-animation :width="500">
    <VCard v-if="uploadDialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">{{ t('system.upload.limits.uploadWarning') }}</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            data-cy="button-close"
            @click.stop="onDialogCancel"
          />
        </VToolbarItems>
      </VToolbar>
      <div class="pa-2">
        <p v-if="alreadyAtUploadLimit">
          {{ t('system.upload.limits.onUploadLimit', { limit: maxUploadItems }) }}
        </p>
        <p v-else>
          {{ t('system.upload.limits.addingOverLimit', { count: fileCache.length }) }}
          <span v-if="uploadQueueTotalCount > 0">{{
            t('system.upload.limits.countAlreadyInProgress', { count: uploadQueueTotalCount })
          }}</span>
          {{ t('system.upload.limits.onlyAllowedAtOnce', { count: maxUploadItems }) }}<br /><br />
          {{ t('system.upload.limits.cancelOrUploadFirst', { count: maxUploadItems - uploadQueueTotalCount }) }}
        </p>
      </div>
      <VCardActions>
        <VSpacer />
        <VBtn text @click.stop="onDialogCancel">{{ t('common.button.cancel') }}</VBtn>
        <VBtn v-if="!alreadyAtUploadLimit" color="success" :loading="uploadDialogLoader" @click.stop="onDialogConfirm">
          {{ t('system.upload.limits.actionAddFirstItems', { count: maxUploadItems - uploadQueueTotalCount }) }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>