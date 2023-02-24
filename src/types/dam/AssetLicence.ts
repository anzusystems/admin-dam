import type {
  AnzuUserAndTimeTrackingAware,
  IntegerId,
  IntegerIdNullable,
  ResourceNameSystemAware
} from '@anzusystems/common-admin'

export interface AssetLicenceMinimal {
  id: IntegerId
  name: string
}

export interface AssetLicence extends AssetLicenceMinimal, AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  extSystem: IntegerIdNullable
  extId: string
}
