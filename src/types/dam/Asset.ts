import type { DocId, DocIdNullable, IntegerId } from '@anzusystems/common-admin'
import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { AssetFile } from '@/types/dam/File'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { AssetStatus } from '@/model/dam/valueObject/AssetStatus'
import type { DistributionServiceName } from '@/types/dam/DamConfig'

interface Texts {
  displayTitle: string
}

interface Flags {
  described: boolean
  visible: boolean
}

interface Attributes {
  assetType: AssetType
  assetStatus: AssetStatus
}

export interface Suggestions extends Record<string, Array<string>> {}

export type AssetCustomData = Record<string, any>

interface Metadata {
  authorSuggestions: Suggestions
  keywordSuggestions: Suggestions
  customData: any
}

export interface AssetFileProperties {
  distributesInServices: DistributionServiceName[]
  slotNames: string[]
  fromRss: boolean
  width: number
  height: number
}

export interface AssetSearchListItemDto extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  texts: Texts
  attributes: Attributes
  flags: Flags
  licence: IntegerId
  mainFile: null | AssetFile
  keywords: DocId[]
  authors: DocId[]
  metadata: Metadata
  assetFileProperties: AssetFileProperties
}

export interface AssetDetailItemDto extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  texts: Texts
  attributes: Attributes
  flags: Flags
  licence: IntegerId
  mainFile: null | AssetFile
  keywords: DocId[]
  authors: DocId[]
  podcasts: DocId[]
  metadata: Metadata
  distributionCategory: DocIdNullable
  assetFileProperties: AssetFileProperties
}

export interface AssetMetadataDto extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware, Metadata {
  id: DocId
  customData: AssetCustomData
}

export interface AssetCreateDto {
  type: AssetType
}
