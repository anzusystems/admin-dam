import type { UpdateUser, User } from '@/types/dam/User'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import { ENTITY } from '@/services/api/dam/userApi'

export function useUserFactory() {
  const createDefault = (): User => {
    return {
      id: 0,
      email: '',
      firstName: '',
      lastName: '',
      roles: [],
      permissionGroups: [],
      permissions: {},
      resolvedPermissions: {},
      assetLicences: [],
      enabled: true,
      createdAt: dateTimeNow(),
      adminToExtSystems: [],
      userToExtSystems: [],
      allowedAssetExternalProviders: [],
      allowedDistributionServices: [],
      modifiedAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  const createDefaultForUpdate = (user: User): UpdateUser => {
    return {
      id: 0,
      firstName: user.firstName,
      lastName: user.lastName,
      plainPassword: '',
      adminToExtSystems: user.adminToExtSystems,
      userToExtSystems: [],
      assetLicences: user.assetLicences,
      allowedAssetExternalProviders: user.allowedAssetExternalProviders,
      allowedDistributionServices: user.allowedDistributionServices,
    }
  }

  return {
    createDefault,
    createDefaultForUpdate,
  }
}
