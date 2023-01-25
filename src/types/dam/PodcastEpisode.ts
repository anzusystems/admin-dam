import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { DatetimeUTCNullable, DocId, DocIdNullable } from '@anzusystems/common-admin'
import type { System } from '@/types/System'
import type { Links } from '@/types/dam/File'

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
  links?: Links
  previewImage: DocIdNullable
}
