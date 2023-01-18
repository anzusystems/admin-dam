import { AssetType } from '@/model/dam/valueObject/AssetType'
import type { AssetCreateDto } from '@/types/dam/Asset'

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
