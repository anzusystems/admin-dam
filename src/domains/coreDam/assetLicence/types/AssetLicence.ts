import type { DamAssetLicence, DatetimeUTCNullable, DocId, IntegerId } from '@anzusystems/common-admin'

export interface AssetLicenceInternalRule {
  active: boolean
  markAsInternalSince: DatetimeUTCNullable
}

export interface AssetLicenceFlags {
  manualUploadAllowed: boolean
  directUseAllowed: boolean
}

export interface AssetLicenceAutoDelete {
  active: boolean
  olderThanDays: number
}

export interface DamAssetLicenceExtended extends DamAssetLicence {
  internalRule: AssetLicenceInternalRule
  internalRuleAuthors: DocId[]
  internalRuleUsers: IntegerId[]
  flags: AssetLicenceFlags
  autoDelete: AssetLicenceAutoDelete
}
