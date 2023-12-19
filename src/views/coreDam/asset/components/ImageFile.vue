<script lang="ts" setup>
import type { AssetFileImage } from '@anzusystems/common-admin'
import {
  ADialogToolbar,
  AssetFileProcessStatus,
  type DocId,
  type DocIdNullable,
  isNull,
} from '@anzusystems/common-admin'
import { computed, ref, watch } from 'vue'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import { fetchImageFile } from '@/services/api/coreDam/imageApi'
import { useI18n } from 'vue-i18n'
import AssetByImageIdLink from '@/views/coreDam/asset/components/AssetByImageIdLink.vue'

const props = withDefaults(
  defineProps<{
    modelValue: DocIdNullable
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
  (e: 'update:modelValue', data: DocIdNullable): void
}>()

const { t } = useI18n()

const loading = ref(false)
const dialog = ref(false)
const newFileId = ref<DocId>('')
const imageFile = ref<null | AssetFileImage>(null)

const fetchImage = async (id: DocId) => {
  loading.value = true
  imageFile.value = await fetchImageFile(id)
  loading.value = false
}

const fileIdModel = computed({
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
  if (imageFile.value && imageFile.value.fileAttributes.status === AssetFileProcessStatus.Duplicate) return true
  return false
})

const removeImage = () => {
  fileIdModel.value = null
  imageFile.value = null
}

const onConfirm = () => {
  if (newFileId.value.length === 0) return
  dialog.value = false
  fileIdModel.value = newFileId.value
}

const onCancel = () => {
  dialog.value = false
}

watch(
  fileIdModel,
  (newValue, oldValue) => {
    if (newValue !== oldValue && !isNull(newValue)) {
      fetchImage(newValue)
    }
  },
  { immediate: true }
)
</script>

<template>
  <VImg
    v-if="loading"
    :width="width"
    :height="height"
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
    :height="width"
    :src="src"
    contain
  >
    <template #placeholder />
    <template
      v-if="isDuplicate"
      #default
    >
      <div
        class="dam-upload-queue__overlay dam-upload-queue__overlay--warning d-flex align-center justify-center flex-column"
      >
        <VIcon
          icon="mdi-alert"
          class="ma-1"
          size="x-small"
          color="warning"
        />
        <div class="text-warning">
          {{ t('coreDam.asset.queueItem.duplicate') }}
        </div>
        <AssetByImageIdLink
          v-if="imageFile"
          variant="text"
          size="small"
          :image-id="imageFile.id"
        >
          {{ t('coreDam.asset.queueItem.viewOriginal') }}&nbsp;<VIcon icon="mdi-open-in-new" />
        </AssetByImageIdLink>
      </div>
    </template>
  </VImg>
  <div v-if="showActions">
    <VBtn
      variant="text"
      class="my-2 mr-2"
      @click.stop="dialog = true"
    >
      {{ t('system.imagePreview.actions.selectImage') }}
    </VBtn>
    <VBtn
      v-if="fileIdModel !== null"
      variant="text"
      class="my-2"
      @click.stop="removeImage"
    >
      {{ t('system.imagePreview.actions.unassign') }}
    </VBtn>
  </div>
  <VDialog
    v-if="showActions"
    v-model="dialog"
    :width="500"
  >
    <VCard
      v-if="dialog"
      data-cy="delete-panel"
    >
      <ADialogToolbar @on-cancel="onCancel">
        {{ t('system.imagePreview.actions.selectImage') }}
      </ADialogToolbar>
      <VCardText>
        <VTextField
          v-model="newFileId"
          :label="t('system.imagePreview.actions.selectImage')"
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
</template>
