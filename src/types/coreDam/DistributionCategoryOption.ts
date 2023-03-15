import type { AnzuUserAndTimeTrackingAware, DocId, ResourceNameSystemAware } from '@anzusystems/common-admin'

export interface DistributionCategoryOption extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  readonly serviceSlug: string
  value: string
  assignable: boolean
  select: DocId
  position: number
}
