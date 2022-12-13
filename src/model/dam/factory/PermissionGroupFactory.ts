import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import type { PermissionGroup } from '@/types/dam/PermissionGroup'
import { ENTITY } from '@/services/api/dam/permissionGroupApi'

export function usePermissionGroupFactory() {
  const createDefault = (): PermissionGroup => {
    return {
      id: 0,
      title: '',
      description: '',
      permissions: {},
      users: [],
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
