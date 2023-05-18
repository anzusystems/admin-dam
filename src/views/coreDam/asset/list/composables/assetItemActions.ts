import { computed } from 'vue'
import { isImageFile } from '@/types/coreDam/File'
import type { AssetListItem } from '@/stores/coreDam/assetListStore'
import type { AssetSearchListItemDto } from '@/types/coreDam/Asset'

const IMAGE_HEIGHT = 200
const IMAGE_BG_COLOR_DEFAULT = '#ccc'

export function useAssetItemActions(item: AssetListItem) {
  const asset = computed<AssetSearchListItemDto>(() => {
    return item.asset
  })

  const assetType = computed(() => {
    return asset.value.attributes.assetType
  })

  const assetStatus = computed(() => {
    return asset.value.attributes.assetStatus
  })

  const imageProperties = computed(() => {
    if (asset.value.mainFile && asset.value.mainFile.links && asset.value.mainFile.links.image_list) {
      return {
        url: asset.value.mainFile.links.image_list.url,
        width: asset.value.mainFile.links.image_list.width,
        height: asset.value.mainFile.links.image_list.height,
        bgColor:
          isImageFile(asset.value.mainFile) &&
          asset.value.mainFile.imageAttributes &&
          asset.value.mainFile.imageAttributes.mostDominantColor
            ? asset.value.mainFile.imageAttributes.mostDominantColor
            : IMAGE_BG_COLOR_DEFAULT,
      }
    }
    return {
      url: undefined,
      width: undefined,
      height: IMAGE_HEIGHT,
      bgColor: IMAGE_BG_COLOR_DEFAULT,
    }
  })

  return {
    asset,
    assetType,
    assetStatus,
    imageProperties,
  }
}
