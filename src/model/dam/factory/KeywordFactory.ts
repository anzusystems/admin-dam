import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import { ENTITY } from '@/services/api/dam/assetLicenceApi'
import type { Keyword } from '@/types/dam/Keyword'

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
