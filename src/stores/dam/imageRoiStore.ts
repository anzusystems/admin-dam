import { acceptHMRUpdate, defineStore } from 'pinia'
import type { RegionOfInterest } from '@/types/dam/Roi'

interface State {
  loader: boolean
  roi: null | RegionOfInterest
  timestampCropper: number
  timestampRoiPreviews: number
}

export const useImageRoiStore = defineStore('damImageRoiStore', {
  state: (): State => ({
    loader: true,
    roi: null,
    timestampCropper: Date.now(),
    timestampRoiPreviews: Date.now(),
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
    forceReloadRoiPreviews() {
      this.timestampRoiPreviews = Date.now()
    },
    forceReloadCropper() {
      this.timestampCropper = Date.now()
    },
    reset() {
      this.loader = true
      this.roi = null
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImageRoiStore, import.meta.hot))
}
