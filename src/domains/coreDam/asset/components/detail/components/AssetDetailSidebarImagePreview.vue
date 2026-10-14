<script lang="ts" setup>
import type { AssetFileImagePreviewNullable, AssetFileVideo, DocId } from '@anzusystems/common-admin'
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
const videoFile = ref<AssetFileVideo | null>(null)
const chooseImagePreviewFromDistributionDialog = ref(false)

const assetDetailStore = useAssetDetailStore()
const { showRecordWas, showErrorsDefault, showUnknownError } = useAlerts()
const { can, canForAll } = useAuth()

/* The image the server holds for the file the card shows. The card shows an image as soon as it is picked, before
 * it is saved: this is what it goes back to when the save fails. */
let savedImagePreview: AssetFileImagePreviewNullable = null
// The changes made in the card, counted: a save that failed puts the saved image back only under its own change.
let changes = 0
// One save after the other: an image can be picked in the card again while the one before it is being saved.
let saves: Promise<void> = Promise.resolve()

const showVideoFile = (file: AssetFileVideo) => {
  videoFile.value = file
  savedImagePreview = file.imagePreview
}

/* The reads of the file the card is to show, counted: two changes of the slot close after each other start two of
 * them, and the answer of the older can come last. Only the one asked for last is shown, and the card spins until
 * that one is answered. */
let latestFileRead = 0

/* A read that failed leaves the card with no file. The one read before it is of another slot than the select above
 * the card says by now, and what is picked in the card is saved for the file the card shows. */
const readVideoFile = async (fileId: DocId) => {
  const asked = ++latestFileRead
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

/* The image was set for the file the dialog was opened for, which is the one the card shows - of the slot of the
 * select above it, not always the main file of the asset. Read again, it shows what the server has set. */
const afterSuccessfulConfirmFromDistribution = (fileId: DocId) => {
  if (videoFile.value?.id === fileId) readVideoFile(fileId)
}

const save = async (fileId: DocId, picked: AssetFileImagePreviewNullable, change: number) => {
  try {
    await updatePreviewImage(fileId, picked)
    if (videoFile.value?.id === fileId) savedImagePreview = picked
    showRecordWas('updated')
  } catch (e) {
    // The request rejects with what axios threw, or with nothing at all: neither is an error the alerts know.
    if (!showErrorsDefault(e)) showUnknownError()
    // Unless the card shows another file by now, or was changed again meanwhile: that change is saved next.
    if (videoFile.value?.id === fileId && change === changes) videoFile.value.imagePreview = savedImagePreview
  }
}

/* A save goes out for the file and with the image it was asked for, whatever the card shows by the time its turn
 * comes. */
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
