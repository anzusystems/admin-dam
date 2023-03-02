import { acceptHMRUpdate, defineStore } from 'pinia'
import type { RegionOfInterest } from '@/types/coreDam/Roi'
import type { ImageFile } from '@/types/coreDam/File'

interface State {
  imageFile: null | ImageFile
  loader: boolean
  roi: null | RegionOfInterest
  timestampCropper: number
  timestampRoiPreviews: number
}

export const useImageRoiStore = defineStore('damImageRoiStore', {
  state: (): State => ({
    imageFile: null,
    loader: false,
    roi: null,
    timestampCropper: Date.now(),
    timestampRoiPreviews: Date.now(),
  }),
  actions: {
    setImageFile(file: ImageFile | null) {
      this.imageFile = file
    },
    setRoi(roi: RegionOfInterest | null) {
      this.roi = roi
    },
    showLoader() {
      this.loader = true
    },
    hideLoader() {
      this.loader = false
    },
    forceReloadRoiPreviews() {
      this.timestampRoiPreviews = Date.now()
    },
    forceReloadCropper() {
      this.timestampCropper = Date.now()
    },
    reset() {
      this.imageFile = null
      this.loader = false
      this.roi = null
      this.timestampCropper = Date.now()
      this.timestampRoiPreviews = Date.now()
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImageRoiStore, import.meta.hot))
}
