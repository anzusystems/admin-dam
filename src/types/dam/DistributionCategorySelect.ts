import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { DistributionCategoryOption } from '@/types/dam/DistributionCategoryOption'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionServiceName } from '@/types/dam/DamConfig'

export interface DistributionCategorySelect extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  serviceSlug: DistributionServiceName
  type: AssetType
  extSystem: IntegerId
  options: DistributionCategoryOption[]
}
