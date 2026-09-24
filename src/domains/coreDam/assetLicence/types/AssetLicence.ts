import type {
  DamAssetLicence,
  DamAssetLicenceMinimal,
  DatetimeUTCNullable,
  DocId,
  DocIdNullable,
  IntegerId,
} from '@anzusystems/common-admin'

export interface AssetLicenceInternalRule {
  active: boolean
  markAsInternalSince: DatetimeUTCNullable
}

export interface AssetLicenceFlags {
  manualUploadAllowed: boolean
  directUseAllowed: boolean
  singleUseEnforced: boolean
}

export interface AssetLicenceAutoDelete {
  active: boolean
  olderThanDays: number
}

export interface DamAssetLicenceExtended extends DamAssetLicence {
  badge: string
  internalRule: AssetLicenceInternalRule
  internalRuleAuthors: DocId[]
  internalRuleUsers: IntegerId[]
  flags: AssetLicenceFlags
  autoDelete: AssetLicenceAutoDelete
  defaultAuthor: DocIdNullable
}

export type DamAssetLicenceCached = DamAssetLicenceMinimal & {
  badge: string
  autoDelete: AssetLicenceAutoDelete
}
