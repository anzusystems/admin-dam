import { cloneDeep } from '@anzusystems/common-admin'
import type { AssetFileImage, DocId } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

import { rotateImage } from '@/domains/coreDam/asset/api/imageApi'
import { useAssetDetailStore } from '@/domains/coreDam/asset/store/assetDetailStore'

/* The rotations of image files, whichever tab of the detail pressed them, and whatever became of it since: a file turns
 * once at a time, from the press until its result is put where it goes. The result is the file the server answers the
 * rotation with: the main file of the asset the detail holds, when it is that, and `rotated`, which the tab of the
 * region open by then draws when it shows that file. */
export const useImageRotationStore = defineStore('damImageRotationStore', () => {
  const rotating = ref<DocId[]>([])
  const rotated = shallowRef<AssetFileImage | null>(null)

  const isRotating = (imageId: DocId) => rotating.value.includes(imageId)

  /** Whether the file was turned; not when a rotation of it runs already. */
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
