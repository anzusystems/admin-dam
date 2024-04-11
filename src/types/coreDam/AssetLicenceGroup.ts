import type {
  AnzuUserAndTimeTrackingAware,
  IntegerId,
  IntegerIdNullable,
  ResourceNameSystemAware
} from '@anzusystems/common-admin'

export interface AssetLicenceGroup extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  name: string
  extSystem: IntegerIdNullable
  licences: IntegerId[]
}
