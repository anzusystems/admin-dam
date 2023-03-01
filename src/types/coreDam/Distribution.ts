import type { DistributionServiceName } from '@/types/coreDam/DamConfig'
import type { DatetimeUTCNullable, DocId } from '@anzusystems/common-admin'
import { isDefined } from '@anzusystems/common-admin'
import type { DistributionStatus } from '@/model/coreDam/valueObject/DistributionStatus'
import type { DistributionYoutubePrivacy } from '@/model/coreDam/valueObject/DistributionYoutubePrivacy'
import type { DistributionFailReason } from '@/model/coreDam/valueObject/DistributionFailReason'

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
  distributionService: DistributionServiceName
}

export interface DistributionAuthUrl {
  url: string
}

export interface DistributionItem {
  id: DocId
  assetId: DocId
  assetFileId: DocId
  extId: string
  distributionService: DistributionServiceName
  status: DistributionStatus
  failReason: DistributionFailReason
  blockedBy: DocId[]
  publishAt: DatetimeUTCNullable
  _resourceName: string
}

export interface DistributionJwCreateRedistributeDto {
  id: DocId
  publishAt: DatetimeUTCNullable
  texts: TextsJw
  distributionService: DistributionServiceName
  blockedBy: DocId[]
}

export interface DistributionJwRedistributeDto extends DistributionJwCreateRedistributeDto {}

export interface DistributionCustomCreateRedistributeDto {
  id: DocId
  publishAt: DatetimeUTCNullable
  customData: Record<string, any>
  distributionService: DistributionServiceName
  blockedBy: DocId[]
}

export interface DistributionYoutubeCreateRedistributeDto {
  id: DocId
  publishAt: DatetimeUTCNullable
  texts: TextsYoutube
  distributionService: DistributionServiceName
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

export interface DistributionCustomItem extends DistributionItem {
  customData: Record<string, any>
  distributionData: Record<string, any>
}

export const isDistributionCustomItem = (
  value: DistributionCustomItem | DistributionYoutubeItem | DistributionJwItem
): value is DistributionCustomItem => {
  return isDefined((value as DistributionCustomItem).distributionData)
}
