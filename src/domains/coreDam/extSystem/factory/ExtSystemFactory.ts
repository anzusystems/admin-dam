import { SYSTEM_CORE_DAM } from '@/shared/systems'
import type { DamExtSystem } from '@anzusystems/common-admin'
import { ENTITY } from '@/domains/coreDam/extSystem/api/extSystemApi'

export function useExtSystemFactory() {
  const createDefault = (): DamExtSystem => {
    return {
      id: 0,
      name: '',
      slug: '',
      adminUsers: [],
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
