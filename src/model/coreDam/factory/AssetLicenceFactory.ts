import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'
import type { DamAssetLicenceExtended } from '@/model/coreDam/type/AssetLicence'

export function useAssetLicenceFactory() {
  const createDefault = (): DamAssetLicenceExtended => {
    return {
      id: 0,
      name: '',
      extSystem: null,
      extId: '',
      internalRule: {
        active: false,
        markAsInternalSince: null,
      },
      internalRuleAuthors: [],
      internalRuleUsers: [],
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
