<script setup lang="ts">
// @ts-ignore
import VueCropper from 'vue-cropperjs'
import type Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { computed, onUnmounted, ref } from 'vue'
import { useAssetDetailStore } from '@/stores/dam/assetDetailStore'
import { updateRoi } from '@/services/api/dam/imageRoiApi'
import { isImageFile } from '@/types/dam/File'
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
const cropperOpacityHide = ref(true)

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
        imageRoiStore.forceReloadRoiPreviews()
      }, 2000)
    } catch (error) {
      handleError(error)
    } finally {
      imageRoiStore.hideLoader()
    }
  }
}

const cropperReady = () => {
  cropperOpacityHide.value = false
  applyRegionOfInterest()
  enableCropper()
}

const cropperEnd = () => {
  saveRoi()
}

const showCropper = computed(() => {
  if (
    assetDetailStore.asset &&
    assetDetailStore.asset.mainFile &&
    assetDetailStore.asset.mainFile.links?.image_detail &&
    !imageRoiStore.loader
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
  <VProgressCircular v-if="imageRoiStore.loader" indeterminate color="primary"></VProgressCircular>
  <vue-cropper
    :class="{ 'image-cropper-hidden': cropperOpacityHide }"
    v-if="showCropper"
    :key="imageRoiStore.timestampCropper"
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
.image-cropper-hidden {
  opacity: 0;
}

.cropper-modal {
  background-color: #f1f4f6;
}
</style>
