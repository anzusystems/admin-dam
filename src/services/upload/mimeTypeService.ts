import { damConfigExtSystem } from '@/services/DamConfigExtSystemService'
import { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'

export const getAssetTypeByMimeType = (mimeType: string): DamAssetType | null => {
  for (const [key, values] of Object.entries(damConfigExtSystem)) {
    if (!Object.values(DamAssetType).includes(key as DamAssetType)) continue
    for (let i = 0; i < values.mimeTypes.length; i++) {
      if (mimeType === values.mimeTypes[i]) return key as DamAssetType
    }
  }
  return null
}
