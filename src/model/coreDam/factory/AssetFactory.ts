import { DamAssetType } from '@anzusystems/common-admin'
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
