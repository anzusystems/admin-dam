import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { IntegerId } from '@/types/common'
import type { Permissions } from '@/types/Permission'
import type { System } from '@/types/System'

export interface PermissionGroup extends UserAndTimeTrackingFields, System {
  id: IntegerId
  title: string
  description: string
  permissions: Permissions
  users: IntegerId[]
}

export interface PermissionGroupMinimal extends Pick<PermissionGroup, 'id' | 'title'> {}
