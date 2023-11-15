import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'

export interface DistributionCategorySelect extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  serviceSlug: DamDistributionServiceName
  type: DamAssetType
  extSystem: IntegerId
  options: DistributionCategoryOption[]
}
