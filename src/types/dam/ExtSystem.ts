import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { IntegerId } from '@/types/common'
import type { System } from '@/types/System'

export interface ExtSystem extends UserAndTimeTrackingFields, System {
  id: IntegerId
  name: string
  slug: string
  adminUsers: IntegerId[]
}

export interface ExtSystemMinimal extends Pick<ExtSystem, 'id' | 'name'> {}
