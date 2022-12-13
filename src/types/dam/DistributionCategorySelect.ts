import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { DocId, IntegerId } from '@/types/common'
import type { DistributionCategoryOption } from '@/types/dam/DistributionCategoryOption'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { DistributionServiceName } from '@/types/dam/DamConfig'

export interface DistributionCategorySelect extends UserAndTimeTrackingFields, System {
  id: DocId
  serviceSlug: DistributionServiceName
  type: AssetType
  extSystem: IntegerId
  options: DistributionCategoryOption[]
}
