import { ref } from 'vue'

const showAllMetadata = ref(false)

export function useAssetCustomMetadataForm() {
  const toggleShowAllMetadata = () => {
    showAllMetadata.value = !showAllMetadata.value
  }

  return {
    showAllMetadata,
    toggleShowAllMetadata,
  }
}
