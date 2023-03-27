import type { AnzuUser, IntegerId } from '@anzusystems/common-admin'

export interface UserMinimal {
  id: number
  person: {
    firstName: string
    lastName: string
    fullName: string
  }
  avatar: {
    color: string
    text: string
  }
  email: string
}

export interface UpdateUser extends Pick<UserMinimal, 'id'> {
  assetLicences: IntegerId[]
  allowedAssetExternalProviders: string[]
  allowedDistributionServices: string[]
  adminToExtSystems: IntegerId[]
  readonly userToExtSystems: IntegerId[]
  plainPassword?: string
}

export interface User extends AnzuUser, UpdateUser {}
