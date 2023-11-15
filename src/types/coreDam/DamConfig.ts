import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import type { DistributionStatus } from '@/model/coreDam/valueObject/DistributionStatus'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'

export enum DistributionServiceType {
  Youtube = 'youtubeDistribution',
  Jw = 'jwDistribution',
  Custom = 'customDistribution',
}

export interface DamConfig {
  assetExternalProviders: {
    [key: string]: { title: string }
  }
  distributionServices: {
    [key: string]: {
      title: string
      iconPath: string
      type: DistributionServiceType
      allowedRedistributeStatuses: Array<DistributionStatus>
    }
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

export interface DamPubConfig {
  userAuthType: UserAuthType
}

export enum UserAuthType {
  JsonCredentials = 'json_credentials',
  OAuth2 = 'oauth2',
  Default = JsonCredentials,
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
  blockedBy: Array<DamDistributionServiceName>
  categorySelect: DistributionRequirementsCategorySelectConfig
  strategy: DistributionRequirementStrategy
}

export interface DistributionConfig {
  distributionServices: Array<DamDistributionServiceName>
  distributionRequirements: Record<DamDistributionServiceName, DistributionRequirementsConfig>
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
  slots: string[]
}

export interface DamConfigExtSystem extends Record<DamAssetType, ExtSystemConfig> {
  assetExternalProviders: ExternalProviderAssetConfig
  audio: ExtSystemConfig
  video: ExtSystemConfig
  image: ExtSystemConfig
  document: ExtSystemConfig
}
