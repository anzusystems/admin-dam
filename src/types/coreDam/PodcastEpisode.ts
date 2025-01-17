import type {
  AnzuUserAndTimeTrackingAware,
  AssetFileImagePreviewNullable,
  AssetFileLinks,
  DatetimeUTCNullable,
  DocId,
  DocIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { PodcastLastImportStatus } from '@/model/coreDam/valueObject/PodcastLastImportStatus'

interface Texts {
  title: string
  description: string
  rawDescription: string
}

interface Flags {
  fromRss: boolean
  webPublicExportEnabled: boolean
  mobilePublicExportEnabled: boolean
}

interface Attributes {
  seasonNumber: number | null
  episodeNumber: number | null
  webOrderPosition: number
  mobileOrderPosition: number
  extId: string
  extUrl: string
  rssUrl: string
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
  flags: Flags
  dates: Dates
  position: number
  links?: AssetFileLinks
  imagePreview: AssetFileImagePreviewNullable
}
