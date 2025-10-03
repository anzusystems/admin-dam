import type { DamUser, DamUserUpdateDto } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/userApi'

export function useUserFactory() {
  const createDefault = (): DamUser => {
    return {
      id: 0,
      email: '',
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
      licenceGroups: [],
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

  const createDefaultForUpdate = (user: DamUser): DamUserUpdateDto => {
    return {
      id: 0,
      plainPassword: '',
      adminToExtSystems: user.adminToExtSystems,
      userToExtSystems: user.userToExtSystems,
      assetLicences: user.assetLicences,
      licenceGroups: user.licenceGroups,
      allowedAssetExternalProviders: user.allowedAssetExternalProviders,
      allowedDistributionServices: user.allowedDistributionServices,
    }
  }

  return {
    createDefault,
    createDefaultForUpdate,
  }
}
