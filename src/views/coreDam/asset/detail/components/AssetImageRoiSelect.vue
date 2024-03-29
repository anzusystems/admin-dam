<script setup lang="ts">
import { ACropperjs, cropToRegion, regionToCrop, useAlerts } from '@anzusystems/common-admin'
import { computed, onUnmounted, ref } from 'vue'
import { updateRoi } from '@/services/api/coreDam/imageRoiApi'
import { useImageRoiStore } from '@/stores/coreDam/imageRoiStore'

const { showRecordWas, showErrorsDefault } = useAlerts()

const DAM_IMAGE_ASPECT_RATIO = 16 / 9
const cropperContainerStyle = { overflow: 'hidden', maxHeight: 'calc(100vh - 160px)' }

const imageRoiStore = useImageRoiStore()

const cropper = ref<any>(null) // fix any
const cropperOpacityHide = ref(true)

const imageUrl = computed(() => {
  if (imageRoiStore.imageFile && imageRoiStore.imageFile.links?.image_detail) {
    return imageRoiStore.imageFile.links.image_detail.url
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
  if (cropper.value && imageRoiStore.roi && imageRoiStore.imageFile) {
    enableCropper()
    const data = regionToCrop(
      cropper.value,
      imageRoiStore.roi,
      imageRoiStore.imageFile.imageAttributes.width,
      imageRoiStore.imageFile.imageAttributes.height
    )
    cropper.value.setData(data)
    disableCropper()
  }
}

const saveRoi = async () => {
  if (cropper.value && imageRoiStore.roi && imageRoiStore.imageFile) {
    const roi = cropToRegion(
      cropper.value,
      imageRoiStore.roi,
      imageRoiStore.imageFile.imageAttributes.width,
      imageRoiStore.imageFile.imageAttributes.height
    )
    try {
      imageRoiStore.showLoader()
      await updateRoi(roi.id, roi)
      showRecordWas('updated')
      setTimeout(() => {
        imageRoiStore.forceReloadRoiPreviews()
      }, 2000)
    } catch (error) {
      showErrorsDefault(error)
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
  if (imageRoiStore.imageFile && imageRoiStore.imageFile.links?.image_detail && !imageRoiStore.loader) {
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
  <VProgressCircular
    v-if="imageRoiStore.loader"
    indeterminate
    color="primary"
  />
  <ACropperjs
    v-if="showCropper"
    :key="imageRoiStore.timestampCropper"
    ref="cropper"
    :class="{ 'image-cropper-hidden': cropperOpacityHide }"
    :aspect-ratio="DAM_IMAGE_ASPECT_RATIO"
    :background="false"
    :check-cross-origin="false"
    :container-style="cropperContainerStyle"
    :ready="cropperReady"
    :cropend="cropperEnd"
    :src="imageUrl"
    :view-mode="1"
    :zoom-on-wheel="false"
    canvas
    responsive
  />
</template>

<style lang="scss">
.image-cropper-hidden {
  opacity: 0;
}

.cropper-modal {
  background-color: #f1f4f6;
}
</style>
