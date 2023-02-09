import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { DocId } from '@anzusystems/common-admin'

export interface DistributionImagePreviewDto extends UserAndTimeTrackingFields, System {
  id: DocId
  service: string
  url: string
  selected?: boolean
}
