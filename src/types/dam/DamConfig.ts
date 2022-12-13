import type { AssetType } from '@/model/dam/valueObject/AssetType'

export interface DamConfig {
  assetExternalProviders: {
    [key: string]: { title: string }
  }
  distributionServices: {
    [key: string]: { title: string }
  }
  colorSet: {
    [key: string]: string
  }
  settings: {
    aclCheckEnabled: boolean
    adminAllowListName: string
    allowSelectExtSystem: boolean
    allowSelectLicenceId: boolean
    defaultAssetLicenceId: number
    defaultExtSystemId: number
    imageChunkConfig: {
      minSize: number
      maxSize: number
    }
    maxBulkItemCount: number
  }
}

export type DistributionServiceName = string

export enum DistributionServiceResourceName {
  Youtube = 'youtubeDistribution',
  Jw = 'jwDistribution',
  Custom = 'customDistribution',
}

export type ExternalProviderAssetName = string

export type ExternalProviderAssetConfig = Record<ExternalProviderAssetName, { listingLimit: number; title: string }>

export interface ExtSystemAssetTypeExifMetadata {
  enabled: boolean
  required: boolean
}

export interface DistributionRequirementsCategorySelectConfig {
  enabled: boolean
  required: boolean
}

export enum DistributionRequirementStrategy {
  None = 'none',
  AtLeastOne = 'at_least_one',
  OneFromType = 'one_from_type',
  WaitForAll = 'wait_for_all',
  Default = None,
}

export interface DistributionRequirementsConfig {
  title: string
  requiredAuth: boolean
  blockedBy: Array<DistributionServiceResourceName>
  categorySelect: DistributionRequirementsCategorySelectConfig
  strategy: DistributionRequirementStrategy
  distributionService: {
    resourceName: DistributionServiceResourceName
  }
}

export interface DistributionConfig {
  distributionServices: Array<DistributionServiceName>
  distributionRequirements: Record<DistributionServiceName, DistributionRequirementsConfig>
}

export interface ExtSystemConfig {
  sizeLimit: number
  defaultFileVersion: string
  versions: Array<string>
  mimeTypes: Array<string>
  distribution: DistributionConfig
  authors: ExtSystemAssetTypeExifMetadata
  keywords: ExtSystemAssetTypeExifMetadata
  customMetadataPinnedAmount: number
}

export interface DamConfigExtSystem extends Record<AssetType, ExtSystemConfig> {
  assetExternalProviders: ExternalProviderAssetConfig
  audio: ExtSystemConfig
  video: ExtSystemConfig
  image: ExtSystemConfig
  document: ExtSystemConfig
}
