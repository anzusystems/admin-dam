import type { AssetCreateDto } from '@/types/coreDam/Asset'
import { DamAssetTypeDefault } from '@anzusystems/common-admin'

export function useAssetFactory() {
  const createCreateDto = (): AssetCreateDto => {
    return {
      type: DamAssetTypeDefault,
    }
  }

  return {
    createCreateDto,
  }
}
