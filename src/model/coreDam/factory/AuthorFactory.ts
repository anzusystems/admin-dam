import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/assetLicenceApi'
import type { DamAuthor } from '@/types/coreDam/DamAuthor'
import { AuthorType } from '@/model/coreDam/valueObject/AuthorType'

export function useAuthorFactory() {
  const createDefault = (extSystemId: number, reviewed?: boolean): DamAuthor => {
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
