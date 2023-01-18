import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { Permissions } from '@/types/Permission'
import type { IntegerId } from '@/types/common'
import type { System } from '@/types/System'

export interface UserMinimal {
  id: number
  firstName: string
  lastName: string
  email: string
}

export interface User extends UserMinimal, UserAndTimeTrackingFields, System {
  roles: string[]
  permissions: Permissions
  resolvedPermissions: Permissions
  permissionGroups: IntegerId[]
  assetLicences: IntegerId[]
  allowedAssetExternalProviders: string[]
  allowedDistributionServices: string[]
  adminToExtSystems: IntegerId[]
  enabled: boolean
  ssoId?: string
}

export interface CreateUser
  extends Pick<
    User,
    | 'email'
    | 'firstName'
    | 'lastName'
    | 'enabled'
    | 'adminToExtSystems'
    | 'permissions'
    | 'assetLicences'
    | 'allowedAssetExternalProviders'
    | 'allowedDistributionServices'
    | 'ssoId'
  > {
  plainPassword: string
  superAdmin: boolean
}

export interface UpdateUser
  extends Pick<
    User,
    | 'firstName'
    | 'lastName'
    | 'enabled'
    | 'adminToExtSystems'
    | 'permissions'
    | 'permissionGroups'
    | 'assetLicences'
    | 'allowedAssetExternalProviders'
    | 'allowedDistributionServices'
  > {
  plainPassword?: string
  superAdmin: boolean
}
