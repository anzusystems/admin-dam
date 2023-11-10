import { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import type { AssetCreateDto } from '@/types/coreDam/Asset'

export function useAssetFactory() {
  const createCreateDto = (): AssetCreateDto => {
    return {
      type: DamAssetType.Default,
    }
  }

  return {
    createCreateDto,
  }
}
