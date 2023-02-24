import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { DocId } from '@anzusystems/common-admin'

export interface DistributionImagePreviewDto extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  service: string
  url: string
  selected?: boolean
}
