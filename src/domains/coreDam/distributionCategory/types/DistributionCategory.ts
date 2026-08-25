import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'
import type {
  AnzuUserAndTimeTrackingAware,
  DamAssetTypeType,
  DocId,
  IntegerId,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'

export interface DistributionCategory extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  type: DamAssetTypeType
  extSystem: IntegerId
  selectedOptions: DocId[]
  selectedOptionsDetail: DistributionCategoryOption[]
}
