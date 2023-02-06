import type { AnzuUser, IntegerId } from '@anzusystems/common-admin'

export interface UserMinimal {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface UpdateUser extends Pick<UserMinimal, 'id' | 'firstName' | 'lastName'> {
  assetLicences: IntegerId[]
  allowedAssetExternalProviders: string[]
  allowedDistributionServices: string[]
  adminToExtSystems: IntegerId[]
  plainPassword?: string
}

export interface User extends AnzuUser, UpdateUser {}
