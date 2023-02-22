import type { AnzuUser, IntegerId } from '@anzusystems/common-admin'
import type { User } from '@/types/dam/User'

export interface CurrentUserExtSystem {
  id: IntegerId
  name: string
}

export interface CurrentUserAssetLicence {
  id: IntegerId
  name: string
  extSystem: IntegerId
}

export interface CurrentUserDto
  extends AnzuUser,
    Pick<User, 'firstName' | 'lastName' | 'allowedAssetExternalProviders' | 'allowedDistributionServices'> {
  selectedLicence: CurrentUserAssetLicence | null
  adminToExtSystems: CurrentUserExtSystem[]
  userToExtSystems: CurrentUserExtSystem[]
  assetLicences: CurrentUserAssetLicence[]
}

export interface UpdateCurrentUserDto {
  selectedLicence: IntegerId
}
