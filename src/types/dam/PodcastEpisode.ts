import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { DocId, DocIdNullable, DatetimeUTCNullable } from '@/types/common'
import type { System } from '@/types/System'

interface Texts {
  title: string
  description: string
  rawDescription: string
}

interface Attributes {
  seasonNumber: number | null
  episodeNumber: number | null
  extId: string
}
interface Dates {
  publicationDate: DatetimeUTCNullable
}

export interface PodcastEpisode extends UserAndTimeTrackingFields, System {
  id: DocId
  podcast: DocIdNullable
  asset: DocIdNullable
  texts: Texts
  attributes: Attributes
  dates: Dates
  position: number
}
