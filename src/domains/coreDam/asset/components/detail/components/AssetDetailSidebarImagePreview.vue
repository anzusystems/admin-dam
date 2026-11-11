<script lang="ts" setup>
import type { AssetFileImagePreviewNullable, AssetFileVideo, DocId } from '@anzusystems/common-admin'
import { assetFileIsVideoFile, useAlerts } from '@anzusystems/common-admin'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchVideoFile, updatePreviewImage } from '@/domains/coreDam/asset/api/videoApi'
import AssetDetailSidebarActionsWrapper from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDetailSidebarImagePreviewFromDistributionDialog from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarImagePreviewFromDistributionDialog.vue'
import AssetDetailSlotSelect from '@/domains/coreDam/asset/components/detail/components/AssetDetailSlotSelect.vue'
import { onVideoPreviewSet } from '@/domains/coreDam/asset/components/detail/composables/videoPreviewSet'
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
const videoFile = ref<AssetFileVideo | null>(null)
const chooseImagePreviewFromDistributionDialog = ref(false)

const assetDetailStore = useAssetDetailStore()
const { showRecordWas, showErrorsDefault, showUnknownError } = useAlerts()
const { can, canForAll } = useAuth()

/*
 * The server's image for the shown file. The card shows a picked
 * image before it is saved, and reverts to this when the save fails.
 */
let savedImagePreview: AssetFileImagePreviewNullable = null
// Counts card changes. A failed save reverts the image only if no later change was made.
let changes = 0
// Saves run sequentially. A new image can be picked while the previous one is saving.
let saves: Promise<void> = Promise.resolve()

const showVideoFile = (file: AssetFileVideo) => {
  videoFile.value = file
  savedImagePreview = file.imagePreview
}

/*
 * Counts file reads. Two quick slot changes start two reads, and the older response can arrive last.
 * Only the latest read is shown, and the card spins until it is answered.
 */
let latestFileRead = 0
// File of the latest read: shown now, or shown once answered.
let fileAsked: DocId | null = null

/*
 * A failed read leaves the card empty. The previous file belongs to another slot
 * than the select shows, and a picked image would be saved to the wrong file.
 */
const readVideoFile = async (fileId: DocId) => {
  const asked = ++latestFileRead
  fileAsked = fileId
  loading.value = true
  try {
    const file = await fetchVideoFile(fileId)
    if (asked === latestFileRead) showVideoFile(file)
  } catch (e) {
    if (asked !== latestFileRead) return
    videoFile.value = null
    if (!showErrorsDefault(e)) showUnknownError()
  } finally {
    if (asked === latestFileRead) loading.value = false
  }
}

const activeSlotChange = (slot: null | AssetSlot) => {
  if (!slot || !slot.assetFile) return
  readVideoFile(slot.assetFile.id)
}

const initLoad = async () => {
  const mainFile = assetDetailStore.asset?.mainFile
  if (mainFile && assetFileIsVideoFile(mainFile)) {
    await readVideoFile(mainFile.id)

    return
  }
  loading.value = false
}

/*
 * The image was set for the file the dialog opened for, which is
 * the card's file from the selected slot, not always the main file.
 * Re-reading shows what the server set. This also covers a dialog closed before
 * the save answered, and a re-rendered card whose read may predate the change.
 */
onVideoPreviewSet((fileId) => {
  if (fileAsked === fileId) readVideoFile(fileId)
})

const save = async (fileId: DocId, picked: AssetFileImagePreviewNullable, change: number) => {
  try {
    await updatePreviewImage(fileId, picked)
    if (videoFile.value?.id === fileId) savedImagePreview = picked
    showRecordWas('updated')
  } catch (e) {
    // Shows the server's refusal reason, otherwise an unknown error.
    if (!showErrorsDefault(e)) showUnknownError()
    // Skipped if the card shows another file or was changed again. That change is saved next.
    if (videoFile.value?.id === fileId && change === changes) videoFile.value.imagePreview = savedImagePreview
  }
}

/* A queued save uses the file and image from when it was requested, whatever the card shows when it runs. */
const onSave = (picked: AssetFileImagePreviewNullable) => {
  const fileId = videoFile.value?.id
  if (!fileId) return
  const change = ++changes
  saves = saves.then(() => save(fileId, picked, change))
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
        :show-actions="can(ACL.DAM_VIDEO_UPDATE) && !assetDetailStore.isDeleting"
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
      />
    </div>
  </div>
</template>
