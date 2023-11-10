import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'

export interface DistributionCategorySelect extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  serviceSlug: DistributionServiceName
  type: DamAssetType
  extSystem: IntegerId
  options: DistributionCategoryOption[]
}
