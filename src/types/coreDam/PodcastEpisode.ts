import type {
  AnzuUserAndTimeTrackingAware,
  DatetimeUTCNullable,
  DocId,
  DocIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { AssetFileLinks } from '@/types/coreDam/File'
import type { ImagePreviewNullable } from '@/types/coreDam/ImagePreview'
import type { PodcastLastImportStatus } from '@/model/coreDam/valueObject/PodcastLastImportStatus'

interface Texts {
  title: string
  description: string
  rawDescription: string
}

interface Attributes {
  seasonNumber: number | null
  episodeNumber: number | null
  extId: string
  lastImportStatus: PodcastLastImportStatus
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
  links?: AssetFileLinks
  imagePreview: ImagePreviewNullable
}
