<script lang="ts" setup>
import type { DocId } from '@anzusystems/common-admin'
import { ADialogToolbar, isNull } from '@anzusystems/common-admin'
import { computed, ref, watch } from 'vue'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import type { ImagePreviewNullable } from '@/types/coreDam/ImagePreview'
import type { ImageFile } from '@/types/coreDam/File'
import { AssetFileProcessStatus } from '@/types/coreDam/File'
import { fetchImageFile } from '@/services/api/coreDam/imageApi'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    modelValue: ImagePreviewNullable
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
const emit = defineEmits<{
  (e: 'update:modelValue', data: ImagePreviewNullable): void
  (e: 'changed', data: ImagePreviewNullable): void
}>()

const { t } = useI18n()

const loading = ref(false)
const dialog = ref(false)
const newFileId = ref<DocId>('')
const imageFile = ref<null | ImageFile>(null)

const fetchImage = async (id: DocId) => {
  loading.value = true
  imageFile.value = JSON.parse('{"imageAttributes":{"ratioWidth":0,"ratioHeight":0,"width":0,"height":0,"rotation":0,"mostDominantColor":"#000000"},"metadata":{"exifData":{},"id":"1edd865a-bad9-6408-9cb9-a7df8fa31da5","createdAt":"2023-04-11T12:37:50.000000Z","modifiedAt":"2023-04-11T12:37:50.000000Z","createdBy":1763600,"modifiedBy":1763600},"assetMetadata":{"keywordSuggestions":{},"authorSuggestions":{},"customData":{}},"asset":"1edd865a-bae0-6c3a-be91-a7df8fa31da5","fileAttributes":{"status":"duplicate","failReason":"none","mimeType":"image\\/jpeg","size":81047,"originFileName":"","originUrl":null},"id":"1edd865a-badf-689e-b968-a7df8fa31da5","links":[],"originAssetFile":"1edd8389-69b3-6db8-b3b7-6fc86b59927a","_resourceName":"imageFile","_system":"coreDam","createdAt":"2023-04-11T12:37:50.000000Z","modifiedAt":"2023-04-11T12:37:50.000000Z","createdBy":1763600,"modifiedBy":1763600}')
  // imageFile.value = await fetchImageFile(id)
  loading.value = false
}

const imagePreviewModel = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  },
})

const src = computed(() => {
  if (imageFile.value && imageFile.value.links?.image_detail) return imageFile.value.links.image_detail.url
  return placeholder16x9
})

const isDuplicate = computed(() => {
  if (imageFile.value && imageFile.value.fileAttributes?.status === AssetFileProcessStatus.Duplicate) return true
  return false
})

const isFailed = computed(() => {
  if (imageFile.value && imageFile.value.fileAttributes?.status === AssetFileProcessStatus.Failed) return true
  return false
})

const isProcessed = computed(() => {
  if (imageFile.value && imageFile.value.fileAttributes?.status === AssetFileProcessStatus.Processed) return true
  return false
})

const isProcessing = computed(() => {
  if (imagePreviewModel.value === null) return false
  if (isProcessed.value || isFailed.value || isDuplicate.value) return false
  return true
})

const unassignImage = () => {
  imagePreviewModel.value = null
  imageFile.value = null
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
    class="text-caption"
  >
    {{ t('system.imagePreview.status.isFailedInfo') }}
  </div>
  <div
    v-if="isDuplicate"
    class="text-caption"
  >
    {{ t('system.imagePreview.status.isDuplicateInfo') }}
  </div>
  <div
    v-if="isProcessing"
    class="text-caption"
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
      contain
    />
    <div v-if="showActions">
      <slot name="actions-start" />
      <VBtn
        variant="text"
        class="my-2 mr-2"
        size="small"
        @click.stop="dialog = true"
      >
        {{ t('system.imagePreview.actions.replaceByFileId') }}
      </VBtn>
      <VBtn
        v-if="imagePreviewModel !== null"
        variant="text"
        class="my-2 mr-2"
        size="small"
        @click.stop="unassignImage"
      >
        {{ t('system.imagePreview.actions.unassign') }}
      </VBtn>
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
        <ADialogToolbar @on-cancel="onCancel">
          {{ t('system.imagePreview.actions.replaceByFileId') }}
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
