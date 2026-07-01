import type { DamAssetTypeType } from '@anzusystems/common-admin'

export type AssetExternalProviderId = string | number
export type AssetExternalProviderIdNullable = AssetExternalProviderId | null

export type AssetExternalProviderMetadata = Record<string, string | number | number[] | string[] | boolean>

interface AssetExternalProviderAttributesDto {
  assetType: DamAssetTypeType
}

interface AssetExternalProvideTextsDto {
  displayTitle: string
}

export interface AssetExternalProviderListDto {
  id: AssetExternalProviderId
  texts: AssetExternalProvideTextsDto
  attributes: AssetExternalProviderAttributesDto
  url: string
  metadata: AssetExternalProviderMetadata
}

export interface AssetExternalProviderDetailDto extends AssetExternalProviderListDto {
  metadata: AssetExternalProviderMetadata
}
