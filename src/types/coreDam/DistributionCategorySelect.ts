import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import type { AssetType } from '@/model/coreDam/valueObject/AssetType'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'

export interface DistributionCategorySelect extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  serviceSlug: DistributionServiceName
  type: AssetType
  extSystem: IntegerId
  options: DistributionCategoryOption[]
}
