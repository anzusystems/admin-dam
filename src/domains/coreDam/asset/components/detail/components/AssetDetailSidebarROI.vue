<script lang="ts" setup>
import {
  assetFileIsImageFile,
  cloneDeep,
  useAlerts,
  useDamImageRoiStore,
  usePagination,
} from '@anzusystems/common-admin'
import type { AssetFileImage, DocId } from '@anzusystems/common-admin'
import { onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

import { fetchImageFile } from '@/domains/coreDam/asset/api/imageApi'
import { fetchImageRoiList, fetchRoi } from '@/domains/coreDam/asset/api/imageRoiApi'
import AssetDetailSidebarActionsWrapper from '@/domains/coreDam/asset/components/detail/components/AssetDetailSidebarActionsWrapper.vue'
import AssetDetailSlotSelect from '@/domains/coreDam/asset/components/detail/components/AssetDetailSlotSelect.vue'
import AssetFileRotate from '@/domains/coreDam/asset/components/detail/components/AssetFileRotate.vue'
import { useImageRoiFilter } from '@/domains/coreDam/asset/filter/ImageRoiFilter'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'
import type { AssetSlot } from '@/domains/coreDam/asset/types/AssetSlot'
import { ACL } from '@/domains/system/auth/auth'

withDefaults(
  defineProps<{
    isActive: boolean
  }>(),
  {}
)

const { t } = useI18n()

// The library's store: its frame of the region beside this panel draws what this panel puts there.
const imageRoiStore = useDamImageRoiStore()
const assetDetailStore = useAssetDetailStore()

const { filterConfig, filterData } = useImageRoiFilter()
const { pagination } = usePagination(null)

const { showErrorsDefault, showUnknownError } = useAlerts()

/* What the tab loads - the main file as it opens, the file of another slot, a rotated file read anew - and the region of
 * each: only the latest load writes into the store, says that it failed or stops the spinner, and none does once the
 * tab is gone. */
let loads = 0
let gone = false
const isCurrent = (load: number) => load === loads && !gone

const failed = (load: number, error: unknown) => {
  if (!isCurrent(load)) return
  if (!showErrorsDefault(error)) showUnknownError()
  imageRoiStore.hideLoader()
}

const loadRois = async (load: number, file: AssetFileImage) => {
  imageRoiStore.showLoader()
  try {
    const list = await fetchImageRoiList(file.id, pagination, filterData, filterConfig)
    if (!isCurrent(load)) return
    const roi = list.length > 0 && list[0].id ? await fetchRoi(list[0].id) : null
    if (!isCurrent(load)) return
    imageRoiStore.setRoi(roi)
    imageRoiStore.hideLoader()
  } catch (error) {
    failed(load, error)
  }
}

/** The file read anew for the load, put in the store; nothing when the read failed or another load came since. */
const readFile = async (load: number, fileId: DocId) => {
  try {
    const file = cloneDeep(await fetchImageFile(fileId))
    if (!isCurrent(load)) return undefined
    imageRoiStore.setImageFile(file)

    return file
  } catch (error) {
    failed(load, error)

    return undefined
  }
}

/* The frame of the region draws the image anew only for a file read anew. Only of the file still shown, and while the
 * tab is there: the rotation was of the file shown when it was pressed. Read anew, the main file is the asset's too,
 * which the tab draws when it is opened again. Another load can come between the read and what follows it. */
const afterRotate = async (rotatedId: DocId) => {
  if (gone || imageRoiStore.imageFile?.id !== rotatedId) return
  const load = ++loads
  imageRoiStore.showLoader()
  const rotated = await readFile(load, rotatedId)
  if (!rotated || !isCurrent(load)) return
  assetDetailStore.setMainFileReadAgain(cloneDeep(rotated))
  await loadRois(load, rotated)
  if (!isCurrent(load)) return
  imageRoiStore.forceReloadRoiPreviews()
  imageRoiStore.forceReloadCropper()
}

const activeSlotChange = async (slot: null | AssetSlot) => {
  const load = ++loads
  imageRoiStore.setRoi(null)
  if (!slot || !assetFileIsImageFile(slot.assetFile)) {
    // A load this one replaced can have left the spinner on.
    imageRoiStore.hideLoader()
    return
  }
  imageRoiStore.showLoader()
  const file = await readFile(load, slot.assetFile.id)
  if (!file || !isCurrent(load)) return
  await loadRois(load, file)
  if (!isCurrent(load)) return
  imageRoiStore.forceReloadRoiPreviews()
  imageRoiStore.forceReloadCropper()
}

onMounted(async () => {
  const load = ++loads
  imageRoiStore.reset()
  const mainFile = assetDetailStore.asset?.mainFile
  if (mainFile && assetFileIsImageFile(mainFile)) {
    imageRoiStore.setImageFile(cloneDeep(mainFile))
    await loadRois(load, mainFile)
  }
})

onUnmounted(() => {
  gone = true
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <ABtnTertiary
      v-if="!imageRoiStore.loader"
      @click.stop="imageRoiStore.forceReloadRoiPreviews()"
    >
      {{ t('coreDam.asset.detail.roi.refresh') }}
    </ABtnTertiary>
  </AssetDetailSidebarActionsWrapper>
  <div class="px-3">
    <AssetDetailSlotSelect
      class="mt-4"
      @active-slot-change="activeSlotChange"
    />
    <div class="v-expansion-panel-title px-0">
      {{ t('coreDam.asset.detail.roi.title') }}
    </div>
    <div class="text-body-small">
      {{ t('coreDam.asset.detail.roi.description') }}
    </div>
  </div>
  <div
    v-if="imageRoiStore.loader"
    class="w-100 h-100 d-flex align-center justify-center"
  >
    <VProgressCircular
      indeterminate
      color="primary"
    />
  </div>
  <div
    v-else-if="imageRoiStore.roi"
    class="crop-preview pa-2"
  >
    <div
      v-for="item in imageRoiStore.roi?.links.image_roi_example"
      :key="item.url + '?timestamp=' + imageRoiStore.timestampRoiPreviews"
      class="pb-2"
    >
      <div class="text-label-large">
        {{ item.title }}
      </div>
      <img
        :src="item.url + '?timestamp=' + imageRoiStore.timestampRoiPreviews"
        :width="item.width"
        :height="item.height"
        alt=""
      />
    </div>
  </div>
  <Acl :permission="ACL.DAM_IMAGE_UPDATE">
    <AssetFileRotate
      v-if="imageRoiStore.imageFile"
      :image-id="imageRoiStore.imageFile.id"
      class="mx-2"
      @after-rotate="afterRotate"
    />
  </Acl>
</template>

<style lang="scss">
.crop-preview {
  width: 100%;

  img {
    max-width: 100%;
    height: auto;
  }
}
</style>
