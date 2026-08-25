import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { type DamAssetLicenceGroup } from '@anzusystems/common-admin'
import { ENTITY } from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'

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
