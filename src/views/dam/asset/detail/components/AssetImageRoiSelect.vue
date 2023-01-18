<script setup lang="ts">
// @ts-ignore
import VueCropper from 'vue-cropperjs'
import type Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { fetchImageRoiList, fetchRoi, updateRoi } from '@/services/api/dam/imageRoiApi'
import { usePagination } from '@/composables/system/pagination'
import { isImageFile } from '@/types/dam/File'
import { useImageRoiListFilter } from '@/model/dam/filter/ImageRoiFilter'
import { useImageRoiStore } from '@/stores/dam/imageRoiStore'
import { cropToRegion, regionToCrop } from '@/services/CropperJsService'
import { useErrorHandler } from '@/composables/system/error'
import { useAlerts } from '@/composables/system/alerts'

const { handleError } = useErrorHandler()
const { showRecordWas } = useAlerts()

const DAM_IMAGE_ASPECT_RATIO = 16 / 9
const cropperContainerStyle = { overflow: 'hidden', maxHeight: 'calc(100vh - 160px)' }

const assetDetailStore = useAssetDetailStore()
const imageRoiStore = useImageRoiStore()

const cropper = ref<Cropper | null>(null)

const filter = useImageRoiListFilter()

const pagination = usePagination()

const imageUrl = computed(() => {
  if (
    assetDetailStore.asset &&
    assetDetailStore.asset.mainFile &&
    isImageFile(assetDetailStore.asset.mainFile) &&
    assetDetailStore.asset.mainFile.links?.image_detail
  ) {
    return assetDetailStore.asset.mainFile.links.image_detail.url
  }
  return ''
})

const enableCropper = () => {
  if (cropper.value) {
    cropper.value.enable()
  }
}

const disableCropper = () => {
  if (cropper.value) {
    cropper.value.disable()
  }
}

const applyRegionOfInterest = () => {
  if (
    cropper.value &&
    imageRoiStore.roi &&
    assetDetailStore.asset &&
    assetDetailStore.asset.mainFile &&
    isImageFile(assetDetailStore.asset.mainFile)
  ) {
    enableCropper()
    const data = regionToCrop(
      cropper.value,
      imageRoiStore.roi,
      assetDetailStore.asset.mainFile.imageAttributes.width,
      assetDetailStore.asset.mainFile.imageAttributes.height
    )
    cropper.value.setData(data)
    disableCropper()
  }
}

const saveRoi = async () => {
  if (
    cropper.value &&
    imageRoiStore.roi &&
    assetDetailStore.asset &&
    assetDetailStore.asset.mainFile &&
    isImageFile(assetDetailStore.asset.mainFile)
  ) {
    const roi = cropToRegion(
      cropper.value,
      imageRoiStore.roi,
      assetDetailStore.asset.mainFile.imageAttributes.width,
      assetDetailStore.asset.mainFile.imageAttributes.height
    )
    try {
      imageRoiStore.showLoader()
      await updateRoi(roi.id, roi)
      showRecordWas('updated')
      setTimeout(() => {
        imageRoiStore.forceReload()
      }, 2000)
    } catch (error) {
      handleError(error)
    } finally {
      imageRoiStore.hideLoader()
    }
  }
}

const cropperReady = () => {
  applyRegionOfInterest()
  enableCropper()
}
const cropperEnd = () => {
  saveRoi()
}

onMounted(async () => {
  if (assetDetailStore.asset && assetDetailStore.asset.mainFile && isImageFile(assetDetailStore.asset.mainFile)) {
    imageRoiStore.showLoader()
    const res = await fetchImageRoiList(assetDetailStore.asset.mainFile.id, pagination, filter)
    if (res.length > 0 && res[0].id) {
      const roi = await fetchRoi(res[0].id)
      imageRoiStore.setRoi(roi)
      imageRoiStore.showCropper()
      imageRoiStore.hideLoader()
      return
    }
    imageRoiStore.setRoi(null)
    imageRoiStore.hideLoader()
    return
  }
  imageRoiStore.setRoi(null)
  imageRoiStore.hideLoader()
})

const showCropper = computed(() => {
  if (
    assetDetailStore.asset &&
    assetDetailStore.asset.mainFile &&
    assetDetailStore.asset.mainFile.links?.image_detail &&
    imageRoiStore.cropper
  ) {
    return true
  }
  return false
})

onUnmounted(() => {
  if (cropper.value) {
    cropper.value.destroy()
    cropper.value = null
  }
})
</script>

<template>
  <vue-cropper
    v-if="showCropper"
    :key="imageUrl"
    ref="cropper"
    :aspect-ratio="DAM_IMAGE_ASPECT_RATIO"
    :background="false"
    :checkCrossOrigin="false"
    :container-style="cropperContainerStyle"
    :ready="cropperReady"
    :cropend="cropperEnd"
    :src="imageUrl"
    :viewMode="1"
    :zoomOnWheel="false"
    canvas
    responsive
  ></vue-cropper>
</template>

<style lang="scss">
.cropper-modal {
  background-color: #f1f4f6;
}
</style>
