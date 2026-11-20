import type { DamAssetTypeType, DatetimeUTCNullable } from '@anzusystems/common-admin'

export interface AssetCreateDto {
  type: DamAssetTypeType
}

// Until a common-admin release carries autoDeleteAt on its asset DTOs.
declare module '@anzusystems/common-admin' {
  interface AssetSearchListItemDto {
    autoDeleteAt: Readonly<DatetimeUTCNullable>
  }

  interface AssetDetailItemDto {
    autoDeleteAt: Readonly<DatetimeUTCNullable>
  }
}
