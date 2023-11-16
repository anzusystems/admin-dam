import type { DamAssetType } from '@/model/coreDam/valueObject/DamAssetType'
import type { DamDistributionStatus } from '@/model/coreDam/valueObject/DamDistributionStatus'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'

export enum DamDistributionServiceType {
  Youtube = 'youtubeDistribution',
  Jw = 'jwDistribution',
  Custom = 'customDistribution',
}

export interface DamPrvConfig {
  assetExternalProviders: {
    [key: string]: { title: string }
  }
  distributionServices: {
    [key: string]: {
      title: string
      iconPath: string
      type: DamDistributionServiceType
      allowedRedistributeStatuses: Array<DamDistributionStatus>
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

export type DamExternalProviderAssetName = string

export type DamExternalProviderAssetConfig = Record<
  DamExternalProviderAssetName,
  {
    listingLimit: number
    title: string
  }
>

export interface DamExtSystemAssetTypeExifMetadata {
  enabled: boolean
  required: boolean
}

export interface DamDistributionRequirementsCategorySelectConfig {
  enabled: boolean
  required: boolean
}

export enum DamDistributionRequirementStrategy {
  None = 'none',
  AtLeastOne = 'at_least_one',
  OneFromType = 'one_from_type',
  WaitForAll = 'wait_for_all',
  Default = None,
}

export interface DamDistributionRequirementsConfig {
  title: string
  requiredAuth: boolean
  blockedBy: Array<DamDistributionServiceName>
  categorySelect: DamDistributionRequirementsCategorySelectConfig
  strategy: DamDistributionRequirementStrategy
}

export interface DamDistributionConfig {
  distributionServices: Array<DamDistributionServiceName>
  distributionRequirements: Record<DamDistributionServiceName, DamDistributionRequirementsConfig>
}

export interface DamExtSystemConfigItem {
  sizeLimit: number
  defaultFileVersion: string
  versions: Array<string>
  mimeTypes: Array<string>
  distribution: DamDistributionConfig
  authors: DamExtSystemAssetTypeExifMetadata
  keywords: DamExtSystemAssetTypeExifMetadata
  customMetadataPinnedAmount: number
  slots: string[]
}

export interface DamExtSystemConfig extends Record<DamAssetType, DamExtSystemConfigItem> {
  assetExternalProviders: DamExternalProviderAssetConfig
  audio: DamExtSystemConfigItem
  video: DamExtSystemConfigItem
  image: DamExtSystemConfigItem
  document: DamExtSystemConfigItem
}
