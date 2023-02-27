import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'
import type { Keyword } from '@/types/coreDam/Keyword'

export function useKeywordFactory() {
  const createDefault = (extSystemId: number, reviewed?: boolean): Keyword => {
    return {
      id: '',
      name: '',
      extSystem: extSystemId,
      flags: {
        reviewed: reviewed ?? false,
      },
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
