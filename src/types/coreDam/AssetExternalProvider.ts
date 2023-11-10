import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'

export type AssetExternalProviderId = string | number
export type AssetExternalProviderIdNullable = AssetExternalProviderId | null

export type AssetExternalProviderMetadata = Record<string, string | number | number[] | string[] | boolean>

interface AssetExternalProviderAttributesDto {
  assetType: DamAssetType
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
