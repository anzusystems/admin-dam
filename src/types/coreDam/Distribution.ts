import type { DistributionFailReasonType } from '@/model/coreDam/valueObject/DistributionFailReason'
import type { DistributionYoutubePrivacyType } from '@/model/coreDam/valueObject/DistributionYoutubePrivacy'
import type {
  DamDistributionServiceName,
  DamDistributionStatusType,
  DatetimeUTCNullable,
  DocId,
} from '@anzusystems/common-admin'
import { isDefined } from '@anzusystems/common-admin'

interface TextsJw {
  title: string
  description: string
  author: string
  keywords: string[]
}

interface TextsYoutube {
  title: string
  description: string
  keywords: string[]
}

export interface YoutubeLanguage {
  id: string
  title: string
}

export interface YoutubePlaylist {
  id: string
  title: string
  channelTitle: string
  description: string
}

interface FlagsYoutube {
  embeddable: boolean
  forKids: boolean
  notifySubscribers: boolean
}

export interface DistributionAuthorized {
  authorized: boolean
  distributionService: DamDistributionServiceName
}

export interface DistributionAuthUrl {
  url: string
}

export interface DistributionItem {
  id: DocId
  assetId: DocId
  assetFileId: DocId
  extId: string
  distributionService: DamDistributionServiceName
  status: DamDistributionStatusType
  failReason: DistributionFailReasonType
  blockedBy: DocId[]
  publishAt: DatetimeUTCNullable
  _resourceName: string
}

export interface DistributionJwCreateRedistributeDto {
  id: DocId
  publishAt: DatetimeUTCNullable
  texts: TextsJw
  distributionService: DamDistributionServiceName
  blockedBy: DocId[]
}

export interface DistributionJwRedistributeDto extends DistributionJwCreateRedistributeDto {}

export interface DistributionCustomCreateRedistributeDto {
  id: DocId
  publishAt: DatetimeUTCNullable
  customData: Record<string, any>
  distributionService: DamDistributionServiceName
  blockedBy: DocId[]
}

export interface DistributionYoutubeCreateRedistributeDto {
  id: DocId
  publishAt: DatetimeUTCNullable
  texts: TextsYoutube
  distributionService: DamDistributionServiceName
  privacy: DistributionYoutubePrivacyType
  language: string
  playlist: string
  flags: FlagsYoutube
  blockedBy: DocId[]
}

export interface DistributionJwItem extends DistributionItem {
  texts: TextsJw
  directSourceUrl: ''
}

export interface DistributionYoutubeItem extends DistributionItem {
  language: string
  playlist: string
  channelId: string
  privacy: DistributionYoutubePrivacyType
  flags: FlagsYoutube
  texts: TextsYoutube
}

export interface DistributionUpdateDto {
  id: string,
  asset: DocId
  assetFile: DocId
  extId: string
  status: DamDistributionStatusType
  distributionService: DamDistributionServiceName
  _resourceName: DistributionItemResourceNameType
}

export interface YoutubeDistributionUpdateDto extends DistributionUpdateDto {
}

export interface JwDistributionUpdateDto extends DistributionUpdateDto {
  directSourceUrl: string
}

export interface CustomDistributionUpdateDto extends DistributionUpdateDto {
}

export const DistributionItemResourceName = {
  Jw: 'jwDistribution',
  Youtube: 'youtubeDistribution',
  Custom: 'distribution',
} as const

export type DistributionItemResourceNameType = (typeof DistributionItemResourceName)[keyof typeof DistributionItemResourceName]

export type DistributionItemTypeMap = {
  [DistributionItemResourceName.Jw]: DistributionJwItem,
  [DistributionItemResourceName.Youtube]: DistributionYoutubeItem,
  [DistributionItemResourceName.Custom]: DistributionCustomItem,
}

export type DistributionItemTypes = DistributionItemTypeMap[keyof DistributionItemTypeMap]

export const DistributionDataItemType = {
  Url: 'url',
} as const

export type DistributionDataItemTypeType = (typeof DistributionDataItemType)[keyof typeof DistributionDataItemType]

export const distributionItemIsJwItem = (value: DistributionItem): value is DistributionJwItem => {
  return value._resourceName === DistributionItemResourceName.Jw
}

export const distributionItemIsYoutubeItem = (value: DistributionItem): value is DistributionYoutubeItem => {
  return value._resourceName === DistributionItemResourceName.Youtube
}

export const distributionItemIsCustomItem = (value: DistributionItem): value is DistributionCustomItem => {
  return value._resourceName === DistributionItemResourceName.Custom
}

export interface DistributionDataItem {
  type: DistributionDataItemTypeType
  value: any
}

export interface DistributionCustomItem extends DistributionItem {
  customData: Record<string, any>
  distributionData: Record<string, DistributionDataItem>
}

export const isDistributionCustomItem = (
  value: DistributionCustomItem | DistributionYoutubeItem | DistributionJwItem
): value is DistributionCustomItem => {
  return isDefined((value as DistributionCustomItem).distributionData)
}
