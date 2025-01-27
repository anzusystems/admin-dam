<script lang="ts" setup>
import { useImageRoiStore } from '@/stores/coreDam/imageRoiStore'
import AssetDetailSidebarActionsWrapper from '@/views/coreDam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import { useI18n } from 'vue-i18n'
import AssetFileRotate from '@/views/coreDam/asset/detail/components/AssetFileRotate.vue'
import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { onMounted } from 'vue'
import { assetFileIsImageFile, cloneDeep, usePagination } from '@anzusystems/common-admin'
import { fetchImageRoiList, fetchRoi } from '@/services/api/coreDam/imageRoiApi'
import { useImageRoiFilter } from '@/model/coreDam/filter/ImageRoiFilter'
import AssetDetailSlotSelect from '@/views/coreDam/asset/detail/components/AssetDetailSlotSelect.vue'
import type { AssetSlot } from '@/types/coreDam/AssetSlot'
import { fetchImageFile } from '@/services/api/coreDam/imageApi'

withDefaults(
  defineProps<{
    isActive: boolean
  }>(),
  {}
)

const { t } = useI18n()

const imageRoiStore = useImageRoiStore()
const assetDetailStore = useAssetDetailStore()

const filter = useImageRoiFilter()
const pagination = usePagination()

const loadRois = async () => {
  if (imageRoiStore.imageFile) {
    imageRoiStore.showLoader()
    const res = await fetchImageRoiList(imageRoiStore.imageFile.id, pagination, filter)
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

const afterRotate = async () => {
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
    <div class="text-caption">
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
      :key="item.url"
      class="pb-2"
    >
      <div class="text-subtitle-2">
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
  <AssetFileRotate
    v-if="imageRoiStore.imageFile"
    :image-id="imageRoiStore.imageFile.id"
    class="mx-2"
    @after-rotate="afterRotate"
  />
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
