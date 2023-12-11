import type {
  AnzuUserAndTimeTrackingAware,
  DamAssetType,
  DamDistributionServiceName,
  DocId,
  IntegerId,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'

export interface DistributionCategorySelect extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  serviceSlug: DamDistributionServiceName
  type: DamAssetType
  extSystem: IntegerId
  options: DistributionCategoryOption[]
}
