import type {
  AnzuUserAndTimeTrackingAware,
  DatetimeUTCNullable,
  DocId,
  DocIdNullable,
  ResourceNameSystemAware
} from '@anzusystems/common-admin'
import type { Links } from '@/types/dam/File'
import type { ImagePreviewNullable } from '@/types/dam/ImagePreview'

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

export interface PodcastEpisode extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  podcast: DocIdNullable
  asset: DocIdNullable
  texts: Texts
  attributes: Attributes
  dates: Dates
  position: number
  links?: Links
  imagePreview: ImagePreviewNullable
}
