import type { DistributionFailReasonType } from '@/model/coreDam/valueObject/DistributionFailReason'
import type { DistributionYoutubePrivacy } from '@/model/coreDam/valueObject/DistributionYoutubePrivacy'
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
  privacy: DistributionYoutubePrivacy
  language: string
  playlist: string
  flags: FlagsYoutube
  blockedBy: DocId[]
}

export interface DistributionJwItem extends DistributionItem {
  texts: TextsJw
}

export interface DistributionYoutubeItem extends DistributionItem {
  language: string
  playlist: string
  channelId: string
  privacy: DistributionYoutubePrivacy
  flags: FlagsYoutube
  texts: TextsYoutube
}

export enum DistributionDataItemType {
  Url = 'url',
}

export interface DistributionDataItem {
  type: DistributionDataItemType
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
