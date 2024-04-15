import { SYSTEM_CORE_DAM } from '@/model/systems'
import { type DamAssetLicenceGroup, dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/assetLicenceGroupApi'

export function useAssetLicenceGroupFactory() {
  const createDefault = (): DamAssetLicenceGroup => {
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
