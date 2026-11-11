<script lang="ts" setup>
import {
  AAssetSelect,
  ADialogToolbar,
  AssetFileProcessStatus,
  DamAssetType as AssetTypeValue,
  isNull,
  useAlerts,
} from '@anzusystems/common-admin'
import type {
  AssetFileImage,
  AssetFileImagePreviewNullable,
  AssetSelectReturnData,
  DocId,
} from '@anzusystems/common-admin'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import { fetchImageFile } from '@/domains/coreDam/asset/api/imageApi'
import { useCurrentAssetLicence } from '@/domains/coreDam/asset/composables/currentExtSystem'

withDefaults(
  defineProps<{
    width?: number
    height?: number
    showActions?: boolean
  }>(),
  {
    width: undefined,
    height: undefined,
    showActions: false,
  }
)
const emit = defineEmits<{ changed: [data: AssetFileImagePreviewNullable] }>()

const modelValue = defineModel<AssetFileImagePreviewNullable>({ required: true })

const { t } = useI18n()
const { showErrorsDefault, showUnknownError } = useAlerts()

const loading = ref(false)
const dialog = ref(false)
const newFileId = ref<DocId>('')
/*
 * The last image read. It is kept when the card is cleared, so it can return
 * when the parent restores the image, for example after a failed save of "none".
 */
const imageFile = ref<null | AssetFileImage>(null)
// Counts image reads, so a response for an image the card no longer holds is dropped.
let latestImageRead = 0

/*
 * The read of the current image failed, so its preview and processing state are unknown and not shown.
 * The card keeps its buttons, so the image can still be removed or replaced.
 */
const readFailed = ref(false)

const fetchImage = async (id: DocId) => {
  const asked = ++latestImageRead
  readFailed.value = false
  /*
   * A restored image that is the last read and already processed needs
   * no new read. With the server down that read would never finish.
   * An image still processing is read again to get its progress.
   */
  if (imageFile.value?.id === id && imageFile.value.fileAttributes?.status === AssetFileProcessStatus.Processed) {
    loading.value = false

    return
  }
  loading.value = true
  try {
    const read = await fetchImageFile(id)
    if (asked === latestImageRead) imageFile.value = read
  } catch (e) {
    if (asked !== latestImageRead) return
    readFailed.value = true
    if (!showErrorsDefault(e)) showUnknownError()
  } finally {
    if (asked === latestImageRead) loading.value = false
  }
}

const { currentAssetLicenceId } = useCurrentAssetLicence()

const imagePreviewModel = computed({
  get() {
    return modelValue.value
  },
  set(newValue) {
    modelValue.value = newValue
  },
})

/*
 * Shows nothing when the card holds no image, or when the read
 * failed, since the last read image is then a different one.
 */
const shownFile = computed(() => (isNull(imagePreviewModel.value) || readFailed.value ? null : imageFile.value))

// The image is re-read only when it changes. The editor retries a failed read with this.
const readAgain = () => {
  if (!isNull(imagePreviewModel.value)) fetchImage(imagePreviewModel.value.imageFile)
}

const src = computed(() => {
  if (shownFile.value && shownFile.value.links?.image_detail) return shownFile.value.links.image_detail.url
  return placeholder16x9
})

const isDuplicate = computed(() => {
  if (shownFile.value && shownFile.value.fileAttributes?.status === AssetFileProcessStatus.Duplicate) return true
  return false
})

const isFailed = computed(() => {
  if (shownFile.value && shownFile.value.fileAttributes?.status === AssetFileProcessStatus.Failed) return true
  return false
})

const isProcessed = computed(() => {
  if (shownFile.value && shownFile.value.fileAttributes?.status === AssetFileProcessStatus.Processed) return true
  return false
})

const isProcessing = computed(() => {
  if (imagePreviewModel.value === null || readFailed.value) return false
  if (isProcessed.value || isFailed.value || isDuplicate.value) return false
  return true
})

const unassignImage = () => {
  imagePreviewModel.value = null
  emit('changed', null)
}

const onConfirm = () => {
  if (newFileId.value.length === 0) return
  imagePreviewModel.value = { imageFile: newFileId.value, position: 0 }
  emit('changed', { imageFile: newFileId.value, position: 0 })
  dialog.value = false
}

const onCancel = () => {
  dialog.value = false
}

const selectAsset = (data: AssetSelectReturnData) => {
  if (data.type === 'mainFileId') {
    const imageId = data.value[0] || ''
    imagePreviewModel.value = { imageFile: imageId, position: 0 }
    emit('changed', { imageFile: imageId, position: 0 })
  }
}

watch(
  imagePreviewModel,
  (newValue, oldValue) => {
    if (!isNull(newValue) && newValue.imageFile !== oldValue?.imageFile) {
      fetchImage(newValue.imageFile)
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    v-if="isFailed"
    class="text-body-small"
  >
    {{ t('system.imagePreview.status.isFailedInfo') }}
  </div>
  <div
    v-if="isDuplicate"
    class="text-body-small"
  >
    {{ t('system.imagePreview.status.isDuplicateInfo') }}
  </div>
  <div
    v-if="isProcessing"
    class="text-body-small"
  >
    {{ t('system.imagePreview.status.isProcessingInfo') }}
  </div>
  <div v-if="!isProcessing">
    <VImg
      v-if="loading"
      :width="width"
      :height="height"
      :max-height="300"
      class="asset-image asset-image--loading-bg"
    >
      <template #placeholder />
      <template #default>
        <div class="d-flex w-100 h-100 align-center justify-center">
          <VProgressCircular
            color="primary"
            indeterminate
            class="ml-auto mr-auto"
          />
        </div>
      </template>
    </VImg>
    <VImg
      v-else
      :width="width"
      :height="height"
      :max-height="300"
      :src="src"
    />
    <VBtn
      v-if="readFailed && !loading && imagePreviewModel !== null"
      variant="text"
      class="my-2 mr-2"
      size="small"
      @click.stop="readAgain"
    >
      {{ t('common.button.retry') }}
    </VBtn>
    <div v-if="showActions">
      <slot name="actions-start" />

      <VBtn
        v-if="imagePreviewModel !== null"
        variant="text"
        class="my-2 mr-2"
        size="small"
        @click.stop="unassignImage"
      >
        {{ t('system.imagePreview.actions.unassign') }}
      </VBtn>
      <AAssetSelect
        :select-licences="[currentAssetLicenceId]"
        :min-count="1"
        :max-count="1"
        :asset-type="AssetTypeValue.Image"
        @confirm="selectAsset"
      >
        <template #activator="{ props: assetSelectProps }">
          <VBtn
            variant="text"
            class="my-2 mr-2"
            size="small"
            v-bind="assetSelectProps"
          >
            {{ t('system.imagePreview.actions.selectImage') }}
          </VBtn>
        </template>
      </AAssetSelect>
      <slot name="actions-end" />
    </div>
    <VDialog
      v-model="dialog"
      :width="500"
    >
      <VCard
        v-if="dialog"
        data-cy="delete-panel"
      >
        <ADialogToolbar @cancel="onCancel">
          {{ t('system.imagePreview.actions.selectImage') }}
        </ADialogToolbar>
        <VCardText>
          <VTextField
            v-model="newFileId"
            :label="t('system.imagePreview.model.fileId')"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <ABtnTertiary
            data-cy="button-cancel"
            @click.stop="onCancel"
          >
            {{ t('common.button.cancel') }}
          </ABtnTertiary>
          <ABtnPrimary
            data-cy="button-confirm"
            @click.stop="onConfirm"
          >
            {{ t('common.button.confirm') }}
          </ABtnPrimary>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
