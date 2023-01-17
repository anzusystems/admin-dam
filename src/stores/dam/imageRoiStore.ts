import { acceptHMRUpdate, defineStore } from 'pinia'
import type { RegionOfInterest } from '@/types/dam/Roi'

interface State {
  loader: boolean
  cropper: boolean
  roi: null | RegionOfInterest
  timestamp: number
}

export const useImageRoiStore = defineStore('damImageRoiStore', {
  state: (): State => ({
    loader: true,
    cropper: true,
    roi: null,
    timestamp: Date.now(),
  }),
  actions: {
    setRoi(roi: RegionOfInterest | null) {
      this.roi = roi
    },
    showLoader() {
      this.loader = true
    },
    hideLoader() {
      this.loader = false
    },
    showCropper() {
      this.cropper = true
    },
    hideCropper() {
      this.cropper = false
    },
    forceReload() {
      this.timestamp = Date.now()
    },
    reset() {
      this.loader = true
      this.cropper = false
      this.roi = null
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImageRoiStore, import.meta.hot))
}
