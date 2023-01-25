import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { DocId, IntegerId } from '@anzusystems/common-admin'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionCategoryOption } from '@/types/dam/DistributionCategoryOption'

export interface DistributionCategory extends UserAndTimeTrackingFields, System {
  id: DocId
  name: string
  type: AssetType
  extSystem: IntegerId
  selectedOptions: DocId[]
  selectedOptionsDetail: DistributionCategoryOption[]
}
