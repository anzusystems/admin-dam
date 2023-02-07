<script lang="ts" setup>
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import { isNull } from '@anzusystems/common-admin'
import { computed, ref, watch } from 'vue'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import type { ImageFile } from '@/types/dam/File'
import { fetchImageFile } from '@/services/api/dam/imageApi'

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

const loading = ref(false)
const dialog = ref(false)
const newFileId = ref<DocId>('')
const imageFile = ref<null | ImageFile>(null)

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
  <VImg v-if="loading" :width="width" :height="height" class="asset-image asset-image--loading-bg">
    <template v-slot:placeholder/>
    <template v-slot:default>
      <div class="d-flex w-100 h-100 align-center justify-center">
        <VProgressCircular color="primary" indeterminate class="ml-auto mr-auto" />
      </div>
    </template>
  </VImg>
  <VImg v-else :width="width" :height="width" :src="src" contain />
  <div v-if="showActions">
    <VBtn variant="flat" class="my-2 mr-2" color="secondary" @click.stop="dialog = true">
      WIP Replace by image file ID
    </VBtn>
    <VBtn v-if="fileIdModel !== null" variant="flat" class="my-2" color="secondary" @click.stop="removeImage">
      Unassign image
    </VBtn>
  </div>
  <VDialog v-if="showActions" v-model="dialog" persistent :width="500" no-click-animation>
    <VCard v-if="dialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">Replace by image file ID</div>
        </div>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="onCancel"
            data-cy="button-close"
          />
        </VToolbarItems>
      </VToolbar>
      <VCardText>
        <VTextField label="Image File ID" v-model="newFileId" />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn text @click.stop="onCancel" data-cy="button-cancel"> Cancel </VBtn>
        <VBtn color="success" @click.stop="onConfirm" data-cy="button-confirm"> Confirm </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
