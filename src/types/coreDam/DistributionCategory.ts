import type {
  AnzuUserAndTimeTrackingAware,
  DamAssetType,
  DocId,
  IntegerId,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'

export interface DistributionCategory extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  type: DamAssetType
  extSystem: IntegerId
  selectedOptions: DocId[]
  selectedOptionsDetail: DistributionCategoryOption[]
}
