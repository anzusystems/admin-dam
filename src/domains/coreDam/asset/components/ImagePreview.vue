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
/* The image read last. It stays when the card is left with no image: it is the one that comes back when what
 * holds the card puts the image back, as after a save of "none" that failed. */
const imageFile = ref<null | AssetFileImage>(null)
// The reads of an image, counted: the answer for an image the card holds no more is dropped.
let latestImageRead = 0

/* The read of the image the card holds has failed: nothing is known of that image then, neither its picture nor how
 * far it is processed. The card says neither, and stays as it is for an image: with its buttons, by which the image
 * is taken away or another one picked. */
const readFailed = ref(false)

const fetchImage = async (id: DocId) => {
  const asked = ++latestImageRead
  readFailed.value = false
  /* Put back, the image the card has read last needs no read: with the server away that read would not end. One
   * read as processed, that is: of an image that was still being processed, a read says how far it has got. */
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

/* What the card shows of it: nothing while it holds no image, whoever took the image away, nor once the read of the
 * image it holds has failed - the image read last is another one. */
const shownFile = computed(() => (isNull(imagePreviewModel.value) || readFailed.value ? null : imageFile.value))

// The image the card holds is read again only when it changes: a read that failed is tried again by the editor.
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
