import type {
  AnzuUserAndTimeTrackingAware,
  DatetimeUTCNullable,
  DocId,
  IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { PodcastMode } from '@/model/coreDam/valueObject/PodcastMode'
import type { PodcastLastImportStatus } from '@/model/coreDam/valueObject/PodcastLastImportStatus'
import type { AssetFileLinks } from '@anzusystems/common-admin'
import type { AssetFileImagePreviewNullable } from '@anzusystems/common-admin'

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
  links?: AssetFileLinks
  altLinks?: AssetFileLinks
  imagePreview: AssetFileImagePreviewNullable
  altImage: AssetFileImagePreviewNullable
}

export interface PodcastMinimal {
  id: DocId
  title: string
}
