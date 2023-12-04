import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import type { DamExtSystem } from '@/types/coreDam/DamExtSystem'
import { ENTITY } from '@/services/api/coreDam/extSystemApi'

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
