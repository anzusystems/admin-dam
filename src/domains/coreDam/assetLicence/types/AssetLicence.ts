import type { DamAssetLicence, DatetimeUTCNullable, DocId, IntegerId } from '@anzusystems/common-admin'

export interface AssetLicenceInternalRule {
  active: boolean
  markAsInternalSince: DatetimeUTCNullable
}

export interface DamAssetLicenceExtended extends DamAssetLicence {
  internalRule: AssetLicenceInternalRule
  internalRuleAuthors: DocId[]
  internalRuleUsers: IntegerId[]
}
