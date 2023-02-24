import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { IntegerId, IntegerIdNullable } from '@anzusystems/common-admin'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'

export interface AssetLicenceMinimal {
  id: IntegerId
  name: string
}

export interface AssetLicence extends AssetLicenceMinimal, AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  extSystem: IntegerIdNullable
  extId: string
}
