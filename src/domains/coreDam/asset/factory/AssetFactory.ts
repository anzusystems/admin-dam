import { DamAssetTypeDefault } from '@anzusystems/common-admin'

import type { AssetCreateDto } from '@/domains/coreDam/asset/types/Asset'

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
