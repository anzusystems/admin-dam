import { ref } from 'vue'

export const maxAssetListItems = ref(800)
export const maxUploadItems = ref(50)
export const maxSelectedItems = ref(50)

export function useBetaTestFeatures() {
  return {
    maxAssetListItems,
    maxUploadItems,
    maxSelectedItems,
  }
}
