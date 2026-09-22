import type { AssetCreateDto } from '@/domains/coreDam/asset/types/Asset'
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
