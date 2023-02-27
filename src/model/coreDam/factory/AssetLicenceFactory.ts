import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import type { AssetLicence } from '@/types/coreDam/AssetLicence'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'

export function useAssetLicenceFactory() {
  const createDefault = (): AssetLicence => {
    return {
      id: 0,
      name: '',
      extSystem: null,
      extId: '',
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
