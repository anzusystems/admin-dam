import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'

export interface DistributionCategoryOption extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  readonly serviceSlug: string
  value: string
  assignable: boolean
  select: DocId
  position: number
}
