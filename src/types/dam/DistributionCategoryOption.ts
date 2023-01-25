import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { DocId } from '@anzusystems/common-admin'

export interface DistributionCategoryOption extends UserAndTimeTrackingFields, System {
  id: DocId
  name: string
  readonly serviceSlug: string
  value: string
  assignable: boolean
  select: DocId
  position: number
}
