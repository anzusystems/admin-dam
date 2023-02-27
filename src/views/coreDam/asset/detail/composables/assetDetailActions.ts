import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { storeToRefs } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'
import { AssetStatus } from '@/model/coreDam/valueObject/AssetStatus'
import { isImageFile } from '@/types/coreDam/File'

export function useAssetDetailActions() {
  const sidebar = ref(true)

  const assetDetailStore = useAssetDetailStore()
  const { asset, loader, metadataAreTouched } = storeToRefs(assetDetailStore)

  const toggleSidebar = () => {
    sidebar.value = !sidebar.value
  }

  const metadataTouch = () => {
    metadataAreTouched.value = true
  }
  const metadataUnTouch = () => {
    metadataAreTouched.value = false
  }

  const assetType = computed(() => {
    return asset.value?.attributes.assetType || AssetType.Default
  })

  const assetStatus = computed(() => {
    if (!asset.value) return AssetStatus.Default
    return asset.value.attributes.assetStatus
  })

  const isTypeImage = computed(() => {
    return assetType.value === AssetType.Image
  })
  const isTypeVideo = computed(() => {
    return assetType.value === AssetType.Video
  })
  const isTypeAudio = computed(() => {
    return assetType.value === AssetType.Audio
  })
  const isTypeDocument = computed(() => {
    return assetType.value === AssetType.Document
  })

  const assetMainFile = computed(() => {
    return asset.value?.mainFile || undefined
  })

  const imageProperties = computed(() => {
    if (asset.value?.mainFile && asset.value.mainFile.links && asset.value.mainFile.links.image_detail) {
      return {
        url: asset.value.mainFile.links.image_detail.url,
        width: asset.value.mainFile.links.image_detail.width,
        height: asset.value.mainFile.links.image_detail.height,
        bgColor:
          isImageFile(asset.value.mainFile) &&
          asset.value.mainFile.imageAttributes &&
          asset.value.mainFile.imageAttributes.mostDominantColor
            ? asset.value.mainFile.imageAttributes.mostDominantColor
            : '#ccc',
      }
    }
    return {
      url: '',
      width: 356,
      height: 200,
      bgColor: '#ccc',
    }
  })

  const toolbarTitle = computed(() => {
    if (!asset.value) return ''
    return asset.value.texts.displayTitle
  })

  return {
    sidebar,
    toggleSidebar,
    asset,
    loader,
    metadataAreTouched: readonly(metadataAreTouched),
    metadataTouch,
    metadataUnTouch,
    assetType,
    assetStatus,
    isTypeImage,
    isTypeVideo,
    isTypeAudio,
    isTypeDocument,
    imageProperties,
    assetMainFile,
    toolbarTitle,
  }
}
