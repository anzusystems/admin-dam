import type { CreateUser, UpdateUser, User } from '@/types/dam/User'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { dateTimeNow } from '@/utils/datetime'
import { ENTITY } from '@/services/api/dam/userApi'
import { UserRole } from '@/model/dam/valueObject/UserRole'

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
      allowedAssetExternalProviders: [],
      allowedDistributionServices: [],
      modifiedAt: dateTimeNow(),
      createdBy: 0,
      modifiedBy: 0,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  const createDefaultForCreate = (): CreateUser => {
    return {
      email: '',
      firstName: '',
      lastName: '',
      superAdmin: false,
      plainPassword: '',
      enabled: true,
      adminToExtSystems: [],
      permissions: {},
      assetLicences: [],
      allowedAssetExternalProviders: [],
      allowedDistributionServices: [],
    }
  }

  const createDefaultForUpdate = (user: User): UpdateUser => {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      superAdmin: user.roles.includes(UserRole.Admin),
      plainPassword: '',
      enabled: user.enabled,
      adminToExtSystems: user.adminToExtSystems,
      permissions: user.permissions,
      permissionGroups: user.permissionGroups,
      assetLicences: user.assetLicences,
      allowedAssetExternalProviders: user.allowedAssetExternalProviders,
      allowedDistributionServices: user.allowedDistributionServices,
    }
  }

  return {
    createDefault,
    createDefaultForCreate,
    createDefaultForUpdate,
  }
}
