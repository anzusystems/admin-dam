<script lang="ts" setup>
import type { DocId, DocIdNullable } from '@/types/common'
import { computed, ref, watch } from 'vue'
import { isNull } from '@/utils/common'
import placeholder16x9 from '@/assets/image/placeholder16x9.jpg'
import { fetchAsset } from '@/services/api/dam/assetApi'
import type { AssetDetailItemDto } from '@/types/dam/Asset'

// todo: now it support asset id, needs update on BE

const props = withDefaults(
  defineProps<{
    modelValue: DocIdNullable
    width?: number
    height?: number
  }>(),
  {
    width: undefined,
    height: undefined,
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', data: DocIdNullable): void
}>()

const loading = ref(false)
const dialog = ref(false)
const newAssetId = ref('')
const asset = ref<null | AssetDetailItemDto>(null)

const fetchImage = async (id: DocId) => {
  loading.value = true
  asset.value = await fetchAsset(id)
  loading.value = false
}

const assetIdModel = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  },
})

const src = computed(() => {
  if (asset.value && asset.value.mainFile?.links?.image_detail) return asset.value.mainFile.links.image_detail.url
  return placeholder16x9
})

const removeImage = () => {
  assetIdModel.value = null
  asset.value = null
}

const onConfirm = () => {
  if (newAssetId.value.length === 0) return
  dialog.value = false
  assetIdModel.value = newAssetId.value
}

const onCancel = () => {
  dialog.value = false
}

watch(
  assetIdModel,
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
    <template v-slot:placeholder></template>
    <template v-slot:default>
      <div class="d-flex w-100 h-100 align-center justify-center">
        <VProgressCircular color="primary" indeterminate class="ml-auto mr-auto" />
      </div>
    </template>
  </VImg>
  <VImg v-else :width="width" :height="width" :src="src" contain></VImg>
  <VBtn variant="flat" class="my-2 mr-2" color="secondary" @click.stop="dialog = true">WIP Replace by asset ID</VBtn>
  <VBtn v-if="assetIdModel !== null" variant="flat" class="my-2" color="secondary" @click.stop="removeImage">
    Unassign image
  </VBtn>
  <VDialog v-model="dialog" persistent :width="500" no-click-animation>
    <VCard v-if="dialog" data-cy="delete-panel">
      <VToolbar class="pl-2" density="compact">
        <div class="d-block pl-0 w-100">
          <div class="text-h6">WIP Replace image by asset ID</div>
        </div>
        <VSpacer></VSpacer>
        <VToolbarItems>
          <VBtn
            class="ml-2"
            icon="mdi-close"
            size="small"
            variant="text"
            @click.stop="onCancel"
            data-cy="button-close"
          ></VBtn>
        </VToolbarItems>
      </VToolbar>
      <VCardText>
        <div>Main file will be used</div>
        <VTextField label="Asset ID" v-model="newAssetId" />
      </VCardText>
      <VCardActions>
        <VSpacer></VSpacer>
        <VBtn text @click.stop="onCancel" data-cy="button-cancel"> Cancel </VBtn>
        <VBtn color="success" @click.stop="onConfirm" data-cy="button-confirm"> Confirm </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
