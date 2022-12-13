import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import { ENTITY } from '@/services/api/dam/assetLicenceApi'
import type { Author } from '@/types/dam/Author'
import { AuthorType } from '@/model/dam/valueObject/AuthorType'

export function useAuthorFactory() {
  const createDefault = (extSystemId: number, reviewed?: boolean): Author => {
    return {
      id: '',
      name: '',
      identifier: '',
      extSystem: extSystemId,
      flags: {
        reviewed: reviewed ?? false,
      },
      type: AuthorType.Default,
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
