<script setup lang="ts">
import DFileUpload from '@/components/common/DFileUpload.vue'
import { useUploadQueuesStore } from '@/stores/dam/uploadQueuesStore'
import { QUEUE_ID_UPLOAD_GLOBAL } from '@/services/upload/uploadQueueIds'
import { computed, ref } from 'vue'
import { useBetaTestFeatures } from '@/services/BetaTestFeaturesService'
import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { AssetType } from '@/model/dam/valueObject/AssetType'

withDefaults(
  defineProps<{
    variant?: 'dropzone-fullscreen' | 'button' | 'icon'
    buttonText?: string
    height?: number
  }>(),
  {
    variant: 'dropzone-fullscreen',
    buttonText: '',
    height: undefined,
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
  await uploadQueuesStore.addByFiles(QUEUE_ID_UPLOAD_GLOBAL, files)
  fileCache.value = []
}

const fileInputKey = computed(() => {
  return uploadQueuesStore.getQueueFileInputKey(QUEUE_ID_UPLOAD_GLOBAL)
})

const uploadQueueTotalCount = computed(() => {
  return uploadQueuesStore.getQueueTotalCount(QUEUE_ID_UPLOAD_GLOBAL)
})

const alreadyAtUploadLimit = computed(() => {
  return uploadQueueTotalCount.value === maxUploadItems.value
})

const openDialog = () => {
  uploadDialog.value = true
}

const onDialogCancel = () => {
  fileCache.value = []
  uploadQueuesStore.forceReloadFileInput(QUEUE_ID_UPLOAD_GLOBAL)
  uploadDialog.value = false
}

const onDialogConfirm = async () => {
  uploadDialogLoader.value = true
  const files = fileCache.value.slice(0, maxUploadItems.value - uploadQueueTotalCount.value)
  await uploadQueuesStore.addByFiles(QUEUE_ID_UPLOAD_GLOBAL, files)
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
</script>

<template>
  <DFileUpload
    :variant="variant"
    :button-text="buttonText"
    :height="height"
    :file-input-key="fileInputKey"
    @files-input="assetUpload"
    :accept="uploadAccept"
    :max-sizes="uploadSizes"
  />
  <VDialog v-model="uploadDialog" persistent no-click-animation :width="500">
    <VCard v-if="uploadDialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">Upload warning</div>
        </div>
        <VSpacer></VSpacer>
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="onDialogCancel"
            data-cy="button-close"
          ></VBtn>
        </VToolbarItems>
      </VToolbar>
      <div class="pa-2">
        <p v-if="alreadyAtUploadLimit">
          You are already on upload limit ({{ maxUploadItems }}). Finish upload, then try again.
        </p>
        <p v-else>
          You are trying to upload additional {{ fileCache.length }} files.
          <span v-if="uploadQueueTotalCount > 0">{{ uploadQueueTotalCount }} files are already in progress.</span> Only
          {{ maxUploadItems }} are allowed to upload at once.<br /><br />Do you want to cancel or upload only first
          {{ maxUploadItems - uploadQueueTotalCount }} file(s)?
        </p>
      </div>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn text @click.stop="onDialogCancel">Cancel</VBtn>
        <VBtn v-if="!alreadyAtUploadLimit" color="success" @click.stop="onDialogConfirm" :loading="uploadDialogLoader">
          Add first {{ maxUploadItems - uploadQueueTotalCount }} file(s)
        </VBtn>
      </VCardActions>
    </VCard>
    <VCard> </VCard>
  </VDialog>
</template>
