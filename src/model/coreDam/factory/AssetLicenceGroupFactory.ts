import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/assetLicenceGroupApi'
import type { AssetLicenceGroup } from '@/types/coreDam/AssetLicenceGroup'

export function useAssetLicenceGroupFactory() {
  const createDefault = (): AssetLicenceGroup => {
    return {
      id: 0,
      name: '',
      extSystem: null,
      licences: [],
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
