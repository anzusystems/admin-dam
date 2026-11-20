export interface AssetListView extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  name: string
  extSystem: IntegerIdNullable
  position: number
  groups: IntegerId[]
  licences: IntegerId[]
  uploadLicence: IntegerIdNullable
}

