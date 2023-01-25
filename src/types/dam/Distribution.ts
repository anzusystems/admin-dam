import type { DistributionServiceName, DistributionServiceResourceName } from '@/types/dam/DamConfig'
import type { DatetimeUTCNullable, DocId } from '@anzusystems/common-admin'
import type { DistributionStatus } from '@/model/dam/valueObject/DistributionStatus'
import type { DistributionYoutubePrivacy } from '@/model/dam/valueObject/DistributionYoutubePrivacy'

export enum DistributionFailReason {
  None = 'none',
  Unknown = 'unknown',
  QuotaReached = 'quota_reached',
  RemoteProcessFailed = 'remote_process_failed',
  Default = None,
}

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
}

export interface DistributionJwCreateDto {
  texts: TextsJw
  distributionService: DistributionServiceName
}

export interface DistributionYoutubeCreateDto {
  publishAt: DatetimeUTCNullable
  texts: TextsYoutube
  distributionService: DistributionServiceName
  privacy: DistributionYoutubePrivacy
  language: string
  playlist: string
  flags: FlagsYoutube
}

export interface DistributionJwItem extends DistributionItem {
  texts: TextsJw
  _resourceName: DistributionServiceResourceName.Jw
}

export interface DistributionYoutubeItem extends DistributionItem {
  language: string
  playlist: string
  channelId: string
  publishAt: DatetimeUTCNullable
  privacy: DistributionYoutubePrivacy
  flags: FlagsYoutube
  texts: TextsYoutube
  _resourceName: DistributionServiceResourceName.Youtube
}

//todo
export interface DistributionCustomItem extends DistributionItem {
  _resourceName: DistributionServiceResourceName.Custom
}
