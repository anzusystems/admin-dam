import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'
import type { AssetLicenceExtended } from '@/types/coreDam/AssetLicence'

export function useAssetLicenceFactory() {
  const createDefault = (): AssetLicenceExtended => {
    return {
      id: 0,
      name: '',
      extSystem: null,
      extId: '',
      flags: {
        manualUploadAllowed: true,
        directUseAllowed: true,
      },
      autoDelete: {
        active: false,
        olderThanDays: 0,
      },
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
