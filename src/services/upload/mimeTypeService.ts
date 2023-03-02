import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'

export const getAssetTypeByMimeType = (mimeType: string): AssetType | null => {
  for (const [key, values] of Object.entries(damConfigExtSystem)) {
    if (!Object.values(AssetType).includes(key as AssetType)) continue
    for (let i = 0; i < values.mimeTypes.length; i++) {
      if (mimeType === values.mimeTypes[i]) return key as AssetType
    }
  }
  return null
}
