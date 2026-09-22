import type { RegionOfInterest } from '@/domains/coreDam/asset/types/Roi'
import type { AssetFileImage } from '@anzusystems/common-admin'

export const useImageRoiStore = defineStore('damImageRoiStore', () => {
  const imageFile = ref<AssetFileImage | null>(null)
  const loader = ref(false)
  const roi = ref<RegionOfInterest | null>(null)
  const timestampCropper = ref(Date.now())
  const timestampRoiPreviews = ref(Date.now())

  function setImageFile(file: AssetFileImage | null) {
    imageFile.value = file
  }

  function setRoi(newRoi: RegionOfInterest | null) {
    roi.value = newRoi
  }

  function showLoader() {
    loader.value = true
  }

  function hideLoader() {
    loader.value = false
  }

  function forceReloadRoiPreviews() {
    timestampRoiPreviews.value = Date.now()
  }

  function forceReloadCropper() {
    timestampCropper.value = Date.now()
  }

  function reset() {
    imageFile.value = null
    loader.value = false
    roi.value = null
    timestampCropper.value = Date.now()
    timestampRoiPreviews.value = Date.now()
  }

  return {
    imageFile,
    loader,
    roi,
    timestampCropper,
    timestampRoiPreviews,
    setImageFile,
    setRoi,
    showLoader,
    hideLoader,
    forceReloadRoiPreviews,
    forceReloadCropper,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImageRoiStore, import.meta.hot))
}
