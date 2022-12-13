import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { IntegerId, IntegerIdNullable } from '@/types/common'
import type { System } from '@/types/System'

export interface AssetLicenceMinimal {
  id: IntegerId
  name: string
}

export interface AssetLicence extends AssetLicenceMinimal, UserAndTimeTrackingFields, System {
  extSystem: IntegerIdNullable
  extId: string
}
