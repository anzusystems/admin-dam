import { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { AssetCreateDto } from '@/types/coreDam/Asset'

export function useAssetFactory() {
  const createCreateDto = (): AssetCreateDto => {
    return {
      type: AssetType.Default,
    }
  }

  return {
    createCreateDto,
  }
}
