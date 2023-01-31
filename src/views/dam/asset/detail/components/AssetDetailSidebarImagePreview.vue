<script lang="ts" setup>
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDetailSlotSelect from '@/views/dam/asset/detail/components/AssetDetailSlotSelect.vue'
import { AssetSlot } from '@/types/dam/AssetSlot'
import { onMounted, ref } from 'vue'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import type { VideoFile } from '@/types/dam/File'
import { isVideoFile } from '@/types/dam/File'
import { fetchVideoFile, updatePreviewImage } from '@/services/api/dam/videoApi'
import ImagePreview from '@/views/dam/asset/components/ImagePreview.vue'
import { useI18n } from 'vue-i18n'
import { useErrorHandler } from '@/composables/system/error'
import { useAlerts } from '@/composables/system/alerts'

withDefaults(
  defineProps<{
    isActive: boolean
  }>(),
  {}
)

const { t } = useI18n({ useScope: 'global' })

const loading = ref(true)
const saving = ref(false)
const videoFile = ref<VideoFile | null>(null)

const assetDetailStore = useAssetDetailStore()
const { handleError } = useErrorHandler()
const { showRecordWas } = useAlerts()

const activeSlotChange = async (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  loading.value = true
  videoFile.value = await fetchVideoFile(slot.assetFile.id)
  loading.value = false
}

const initLoad = async () => {
  if (assetDetailStore.asset && assetDetailStore.asset.mainFile && isVideoFile(assetDetailStore.asset.mainFile)) {
    videoFile.value = await fetchVideoFile(assetDetailStore.asset.mainFile.id)
    console.log(videoFile.value)
  }
  loading.value = false
}

const onSave = async () => {
  if (!videoFile.value) return
  saving.value = true
  try {
    await updatePreviewImage(videoFile.value.id, videoFile.value.imagePreview)
    showRecordWas('updated')
  } catch (e) {
    handleError(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await initLoad()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <VBtn
      color="success"
      type="submit"
      @click.stop="onSave"
      variant="flat"
      class="ml-2"
      :loading="saving"
      :disabled="loading"
    >
      {{ t('common.button.save') }}
    </VBtn>
  </AssetDetailSidebarActionsWrapper>
  <div class="px-3">
    <AssetDetailSlotSelect class="mt-4" @active-slot-change="activeSlotChange" />
    <div v-if="loading" class="d-flex w-100 h-100 justify-center align-center pa-2">
      <VProgressCircular indeterminate color="primary" />
    </div>
    <div v-else-if="videoFile">
      <ImagePreview v-model="videoFile.imagePreview" show-actions />
    </div>
  </div>
</template>
