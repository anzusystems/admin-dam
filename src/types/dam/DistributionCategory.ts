import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { DocId, IntegerId } from '@anzusystems/common-admin'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionCategoryOption } from '@/types/dam/DistributionCategoryOption'

export interface DistributionCategory extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  type: AssetType
  extSystem: IntegerId
  selectedOptions: DocId[]
  selectedOptionsDetail: DistributionCategoryOption[]
}
