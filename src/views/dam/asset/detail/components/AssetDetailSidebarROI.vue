<script lang="ts" setup>
import { useImageRoiStore } from '@/stores/dam/imageRoiStore'
import AssetDetailSidebarActionsWrapper from '@/views/dam/asset/detail/components/AssetDetailSidebarActionsWrapper.vue'
import { useI18n } from 'vue-i18n'
import AssetFileRotate from '@/views/dam/asset/detail/components/AssetFileRotate.vue'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { onMounted } from 'vue'
import { isImageFile } from '@/types/dam/File'
import { fetchImageRoiList, fetchRoi } from '@/services/api/dam/imageRoiApi'
import { useImageRoiFilter } from '@/model/dam/filter/ImageRoiFilter'
import { usePagination } from '@/composables/system/pagination'

withDefaults(
  defineProps<{
    isActive: boolean
  }>(),
  {}
)

const { t } = useI18n({ useScope: 'global' })

const imageRoiStore = useImageRoiStore()
const assetDetailStore = useAssetDetailStore()

const filter = useImageRoiFilter()
const pagination = usePagination()

const loadRois = async () => {
  if (assetDetailStore.asset && assetDetailStore.asset.mainFile && isImageFile(assetDetailStore.asset.mainFile)) {
    imageRoiStore.showLoader()
    const res = await fetchImageRoiList(assetDetailStore.asset.mainFile.id, pagination, filter)
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

onMounted(async () => {
  await loadRois()
})
</script>

<template>
  <AssetDetailSidebarActionsWrapper v-if="isActive">
    <VBtn
      v-if="!imageRoiStore.loader"
      color="secondary"
      @click.stop="imageRoiStore.forceReloadRoiPreviews()"
      variant="flat"
    >
      {{ t('coreDam.asset.detail.roi.refresh') }}
    </VBtn>
  </AssetDetailSidebarActionsWrapper>
  <div class="px-3">
    <div class="v-expansion-panel-title px-0">{{ t('coreDam.asset.detail.roi.title') }}</div>
    <div class="text-caption">{{ t('coreDam.asset.detail.roi.description') }}</div>
  </div>
  <div v-if="imageRoiStore.loader" class="w-100 h-100 d-flex align-center justify-center">
    <VProgressCircular indeterminate color="primary"></VProgressCircular>
  </div>
  <div v-else-if="imageRoiStore.roi" class="crop-preview pa-2">
    <div v-for="item in imageRoiStore.roi?.links.image_roi_example" :key="item.url" class="pb-2">
      <div class="text-subtitle-2">{{ item.title }}</div>
      <img
        :src="item.url + '?timestamp=' + imageRoiStore.timestampRoiPreviews"
        :width="item.width"
        :height="item.height"
        alt=""
      />
    </div>
  </div>
  <AssetFileRotate
    v-if="assetDetailStore.asset?.mainFile?.id"
    :image-id="assetDetailStore.asset.mainFile.id"
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
