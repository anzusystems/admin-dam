import type {
  AnzuUserAndTimeTrackingAware,
  DatetimeUTCNullable,
  DocId,
  IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { PodcastMode } from '@/model/coreDam/valueObject/PodcastMode'
import type { PodcastLastImportStatus } from '@/model/coreDam/valueObject/PodcastLastImportStatus'
import type { Links } from '@/types/coreDam/File'
import type { ImagePreviewNullable } from '@/types/coreDam/ImagePreview'

interface Texts {
  title: string
  description: string
}

export interface Attributes {
  rssUrl: string
  mode: PodcastMode
  lastImportStatus: PodcastLastImportStatus
}

interface Dates {
  importFrom: DatetimeUTCNullable
}

export interface Podcast extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  licence: IntegerIdNullable
  texts: Texts
  attributes: Attributes
  dates: Dates
  links?: Links
  imagePreview: ImagePreviewNullable
}

export interface PodcastMinimal {
  id: DocId
  title: string
}
