import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { DocId, IntegerIdNullable } from '@/types/common'
import type { System } from '@/types/System'
import type { PodcastMode } from '@/model/dam/valueObject/PodcastMode'
import type { PodcastLastImportStatus } from '@/model/dam/valueObject/PodcastLastImportStatus'

interface Texts {
  title: string
  description: string
}

export interface Attributes {
  rssUrl: string
  mode: PodcastMode
  lastImportStatus: PodcastLastImportStatus
}

export interface Podcast extends UserAndTimeTrackingFields, System {
  id: DocId
  licence: IntegerIdNullable
  texts: Texts
  attributes: Attributes
}

export interface PodcastMinimal {
  id: DocId
  title: string
}
