import type { DamAssetLicence } from '@anzusystems/common-admin'

interface AssetLicenceFlags {
  manualUploadAllowed: boolean
  directUseAllowed: boolean
}

interface AssetLicenceAutoDelete {
  active: boolean
  olderThanDays: number
}

export interface AssetLicenceExtended extends DamAssetLicence {
  flags: AssetLicenceFlags
  autoDelete: AssetLicenceAutoDelete
}
