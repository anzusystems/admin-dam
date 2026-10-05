<script lang="ts" setup>
import type { AssetFileVideo } from '@anzusystems/common-admin'
import { assetFileIsVideoFile, useAlerts } from '@anzusystems/common-admin'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchVideoFile, updatePreviewImage } from '@/domains/coreDam/asset/api/videoApi'
import AssetDetailSidebarActionsWrapper from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDetailSidebarImagePreviewFromDistributionDialog from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarImagePreviewFromDistributionDialog.vue'
import AssetDetailSlotSelect from '@/domains/coreDam/asset/components/detail/components/AssetDetailSlotSelect.vue'
import ImagePreview from '@/domains/coreDam/asset/components/ImagePreview.vue'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import { ACL, useAuth } from '@/domains/system/auth/auth'

withDefaults(
  defineProps<{
    isActive: boolean
    dataCy?: string
  }>(),
  {
    dataCy: undefined,
  }
)

const { t } = useI18n()
const loading = ref(true)
const saving = ref(false)
const videoFile = ref<AssetFileVideo | null>(null)
const chooseImagePreviewFromDistributionDialog = ref(false)

const assetDetailStore = useAssetDetailStore()
const { showRecordWas, showErrorsDefault } = useAlerts()
const { can, canForAll } = useAuth()

const activeSlotChange = async (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  loading.value = true
  videoFile.value = await fetchVideoFile(slot.assetFile.id)
  loading.value = false
}

const initLoad = async () => {
  if (
    assetDetailStore.asset &&
    assetDetailStore.asset.mainFile &&
    assetFileIsVideoFile(assetDetailStore.asset.mainFile)
  ) {
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
        :show-actions="can(ACL.DAM_VIDEO_UPDATE)"
        @changed="onSave"
      >
        <template #actions-end>
          <VBtn
            v-if="canForAll([ACL.DAM_VIDEO_UPDATE, ACL.DAM_DISTRIBUTION_ACCESS])"
            variant="text"
            class="my-2 mr-2"
            size="small"
            data-cy="button-from-distribution"
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
