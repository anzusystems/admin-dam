import type { DamCurrentUserDto } from '@anzusystems/common-admin'

export interface AssetListView extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  name: string
  extSystem: IntegerIdNullable
  position: number
  groups: IntegerId[]
  licences: IntegerId[]
  uploadLicence: IntegerIdNullable
}

/**
 * Shape resolved by the backend for the current user: licences are already narrowed down to his rights.
 */
export interface AssetListViewResolved {
  id: IntegerId
  name: string
  extSystem: IntegerId
  licences: IntegerId[]
  uploadLicence?: IntegerIdNullable
}

export type DamCurrentUserWithListViewsDto = DamCurrentUserDto & {
  listViews: AssetListViewResolved[]
  selectedListView?: IntegerIdNullable
}
