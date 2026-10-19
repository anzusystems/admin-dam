<script lang="ts" setup>
import {
  assetFileIsImageFile,
  cloneDeep,
  useAlerts,
  useDamImageRoiStore,
  usePagination,
} from '@anzusystems/common-admin'
import { onMounted } from 'vue'
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

const loadRois = async () => {
  if (imageRoiStore.imageFile) {
    imageRoiStore.showLoader()
    const res = await fetchImageRoiList(imageRoiStore.imageFile.id, pagination, filterData, filterConfig)
    if (res.length > 0 && res[0].id) {
      const roi = await fetchRoi(res[0].id)
      imageRoiStore.setRoi(roi)
      imageRoiStore.hideLoader()
      return
    }
    imageRoiStore.setRoi(null)
    imageRoiStore.hideLoader()
    return
  }
  imageRoiStore.setRoi(null)
  imageRoiStore.hideLoader()
}

const { showErrorsDefault, showUnknownError } = useAlerts()

// The reads of a rotated file on their way: only the newest is put in the store.
let rotatedReads = 0

/* The frame of the region draws the image anew only for a file read anew: the rotated one is, unless another rotation
 * read it meanwhile or another file is shown by then (another slot, another asset). */
const afterRotate = async () => {
  const rotated = imageRoiStore.imageFile
  if (rotated) {
    const read = ++rotatedReads
    imageRoiStore.showLoader()
    try {
      const imageFileDetail = await fetchImageFile(rotated.id)
      if (read === rotatedReads && imageRoiStore.imageFile?.id === rotated.id) {
        imageRoiStore.setImageFile(cloneDeep(imageFileDetail))
      }
    } catch (error) {
      if (!showErrorsDefault(error)) showUnknownError()
    }
  }
  await loadRois()
  imageRoiStore.forceReloadRoiPreviews()
  imageRoiStore.forceReloadCropper()
}

const activeSlotChange = async (slot: null | AssetSlot) => {
  imageRoiStore.setRoi(null)
  if (!slot || !assetFileIsImageFile(slot.assetFile)) return
  imageRoiStore.showLoader()
  const imageFileDetail = await fetchImageFile(slot.assetFile.id)
  imageRoiStore.setImageFile(cloneDeep(imageFileDetail))
  await loadRois()
  imageRoiStore.forceReloadRoiPreviews()
  imageRoiStore.forceReloadCropper()
}

onMounted(async () => {
  imageRoiStore.reset()
  imageRoiStore.showLoader()
  if (
    assetDetailStore.asset &&
    assetDetailStore.asset.mainFile &&
    assetFileIsImageFile(assetDetailStore.asset.mainFile)
  ) {
    imageRoiStore.setImageFile(cloneDeep(assetDetailStore.asset.mainFile))
    await loadRois()
  }
  imageRoiStore.hideLoader()
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
