import type { UpdateUser, User } from '@/types/coreDam/User'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@anzusystems/common-admin'
import { ENTITY } from '@/services/api/coreDam/userApi'

export function useUserFactory() {
  const createDefault = (): User => {
    return {
      id: 0,
      email: '',
      firstName: '',
      lastName: '',
      person: {
        firstName: '',
        lastName: '',
        fullName: '',
      },
      avatar: {
        color: '',
        text: '',
      },
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
