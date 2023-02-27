import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'

export interface DistributionCategory extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  type: AssetType
  extSystem: IntegerId
  selectedOptions: DocId[]
  selectedOptionsDetail: DistributionCategoryOption[]
}
