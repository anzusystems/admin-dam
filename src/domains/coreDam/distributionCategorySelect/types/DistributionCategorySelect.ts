import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'
import type {
  AnzuUserAndTimeTrackingAware,
  DamAssetTypeType,
  DamDistributionServiceName,
  DocId,
  IntegerId,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'

export interface DistributionCategorySelect extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  serviceSlug: DamDistributionServiceName
  type: DamAssetTypeType
  extSystem: IntegerId
  options: DistributionCategoryOption[]
}
