import type { DocId, IntegerId } from '@/types/common'
import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { AssetFile } from '@/types/dam/File'
import type { AssetType } from '@/model/dam/valueObject/AssetType'
import type { AssetStatus } from '@/model/dam/valueObject/AssetStatus'

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

export interface AssetSearchListItemDto extends UserAndTimeTrackingFields, System {
  id: DocId
  texts: Texts
  attributes: Attributes
  flags: Flags
  licence: IntegerId
  mainFile: null | AssetFile
  keywords: DocId[]
  authors: DocId[]
  metadata: Metadata
}

export interface AssetDetailItemDto extends UserAndTimeTrackingFields, System {
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
}

export interface AssetMetadataDto extends UserAndTimeTrackingFields, System, Metadata {
  id: DocId
  customData: AssetCustomData
}
