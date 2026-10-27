import { cloneDeep } from '@anzusystems/common-admin'
import type { AssetFileImage, DocId } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

import { rotateImage } from '@/domains/coreDam/asset/api/imageApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'

/*
 * Image file rotations, independent of which detail tab started them or whether
 * it still exists. One rotation per file at a time, until its result is applied.
 * The result is the file returned by the server. It updates the held asset's main
 * file if it is that, and `rotated`, which the open region tab draws for that file.
 */
export const useImageRotationStore = defineStore('damImageRotationStore', () => {
  const rotating = ref<DocId[]>([])
  const rotated = shallowRef<AssetFileImage | null>(null)

  const isRotating = (imageId: DocId) => rotating.value.includes(imageId)

  /**
   * Returns whether the file was rotated. False when a rotation of it is already running.
   */
  async function rotate(imageId: DocId, angle: 90 | 270) {
    if (isRotating(imageId)) return false
    rotating.value = [...rotating.value, imageId]
    try {
      const file = await rotateImage(imageId, angle)
      useAssetDetailStore().setMainFileRotated(cloneDeep(file))
      rotated.value = cloneDeep(file)

      return true
    } finally {
      rotating.value = rotating.value.filter((id) => id !== imageId)
    }
  }

  return {
    rotating,
    rotated,
    isRotating,
    rotate,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useImageRotationStore, import.meta.hot))
}
