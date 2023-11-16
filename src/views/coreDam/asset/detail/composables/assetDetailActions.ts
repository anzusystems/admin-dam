import { useAssetDetailStore } from '@/stores/coreDam/assetDetailStore'
import { storeToRefs } from 'pinia'
import { computed, readonly, ref } from 'vue'
import { DamAssetType } from '@anzusystems/common-admin'
import { DamAssetStatus } from '@anzusystems/common-admin'
import { assetFileIsImageFile } from '@anzusystems/common-admin'

export function useAssetDetailActions() {
  const sidebar = ref(true)

  const assetDetailStore = useAssetDetailStore()
  const { asset, authorConflicts, loader, metadataAreTouched, view } = storeToRefs(assetDetailStore)

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
    return asset.value?.attributes.assetType || DamAssetType.Default
  })

  const assetStatus = computed(() => {
    if (!asset.value) return DamAssetStatus.Default
    return asset.value.attributes.assetStatus
  })

  const isTypeImage = computed(() => {
    return assetType.value === DamAssetType.Image
  })
  const isTypeVideo = computed(() => {
    return assetType.value === DamAssetType.Video
  })
  const isTypeAudio = computed(() => {
    return assetType.value === DamAssetType.Audio
  })
  const isTypeDocument = computed(() => {
    return assetType.value === DamAssetType.Document
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
          assetFileIsImageFile(asset.value.mainFile) &&
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
    view,
    sidebar,
    toggleSidebar,
    asset,
    authorConflicts,
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
