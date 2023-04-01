<script lang="ts" setup>
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDetailSlotSelect from '@/views/coreDam/asset/detail/components/AssetDetailSlotSelect.vue'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import { onMounted, ref } from 'vue'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import type { VideoFile } from '@/types/coreDam/File'
import { isVideoFile } from '@/types/coreDam/File'
import { fetchVideoFile, updatePreviewImage } from '@/services/api/coreDam/videoApi'
import ImagePreview from '@/views/coreDam/asset/components/ImagePreview.vue'
import { useAlerts } from '@anzusystems/common-admin'
import AssetDetailSidebarImagePreviewFromDistributionDialog from '@/views/coreDam/asset/detail/components/AssetDetailSidebarImagePreviewFromDistributionDialog.vue'
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    isActive: boolean
  }>(),
  {}
)

const { t } = useI18n()
const loading = ref(true)
const saving = ref(false)
const videoFile = ref<VideoFile | null>(null)
const chooseImagePreviewFromDistributionDialog = ref(false)

const assetDetailStore = useAssetDetailStore()
const { showRecordWas, showErrorsDefault } = useAlerts()

const activeSlotChange = async (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  loading.value = true
  videoFile.value = await fetchVideoFile(slot.assetFile.id)
  loading.value = false
}

const initLoad = async () => {
  if (assetDetailStore.asset && assetDetailStore.asset.mainFile && isVideoFile(assetDetailStore.asset.mainFile)) {
    videoFile.value = await fetchVideoFile(assetDetailStore.asset.mainFile.id)
  }
  loading.value = false
}

const afterSuccessfulConfirmFromDistribution = () => {
  initLoad()
}

const onSave = async () => {
  if (!videoFile.value) return
  saving.value = true
  try {
    await updatePreviewImage(videoFile.value.id, videoFile.value.imagePreview)
    showRecordWas('updated')
  } catch (e) {
    showErrorsDefault(e)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await initLoad()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive" />
  <div class="px-3">
    <AssetDetailSlotSelect
      class="mt-4"
      @active-slot-change="activeSlotChange"
    />
    <div
      v-if="loading"
      class="d-flex w-100 h-100 justify-center align-center pa-2"
    >
      <VProgressCircular
        indeterminate
        color="primary"
      />
    </div>
    <div v-else-if="videoFile">
      <ImagePreview
        v-model="videoFile.imagePreview"
        show-actions
        @changed="onSave"
      >
        <template #actions-end>
          <VBtn
            variant="flat"
            class="my-2 mr-2"
            color="secondary"
            size="small"
            @click.stop="chooseImagePreviewFromDistributionDialog = true"
          >
            {{ t('system.imagePreview.actions.chooseFromDistribution') }}
          </VBtn>
        </template>
      </ImagePreview>
      <AssetDetailSidebarImagePreviewFromDistributionDialog
        v-if="chooseImagePreviewFromDistributionDialog"
        v-model="chooseImagePreviewFromDistributionDialog"
        :file-id="videoFile.id"
        @after-successful-confirm="afterSuccessfulConfirmFromDistribution"
      />
    </div>
  </div>
</template>
