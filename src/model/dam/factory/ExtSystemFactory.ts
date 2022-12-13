import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import type { ExtSystem } from '@/types/dam/ExtSystem'
import { ENTITY } from '@/services/api/dam/extSystemApi'

export function useExtSystemFactory() {
  const createDefault = (): ExtSystem => {
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
