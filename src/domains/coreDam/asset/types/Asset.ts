import type { DamAssetTypeType, DatetimeUTCNullable } from '@anzusystems/common-admin'

export interface AssetCreateDto {
  type: DamAssetTypeType
}

// common-admin Asset.ts owns autoDeleteAt; drop this once admin-dam moves past 1.47.0-beta.dev-1784059876.
declare module '@anzusystems/common-admin' {
  interface AssetSearchListItemDto {
    autoDeleteAt: Readonly<DatetimeUTCNullable>
  }

  interface AssetDetailItemDto {
    autoDeleteAt: Readonly<DatetimeUTCNullable>
  }
}
