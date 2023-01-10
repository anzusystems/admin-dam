import type { IntegerId, IntegerIdNullable } from '@/types/common'
import type { User } from '@/types/dam/User'

interface CurrentUserExtSystem {
  id: IntegerId
  name: string
}

interface CurrentUserAssetLicence {
  id: IntegerId
  name: string
  extSystem: IntegerId
}

export interface CurrentUserDto
  extends Pick<
    User,
    | 'id'
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'enabled'
    | 'permissions'
    | 'resolvedPermissions'
    | 'allowedAssetExternalProviders'
    | 'allowedDistributionServices'
    | 'ssoId'
  > {
  superAdmin: boolean
  selectedLicence: IntegerIdNullable
  adminToExtSystems: CurrentUserExtSystem[]
  userToExtSystems: CurrentUserExtSystem[]
  assetLicences: CurrentUserAssetLicence[]
}

export interface UpdateCurrentUserDto extends Pick<CurrentUserDto, 'selectedLicence'> {}