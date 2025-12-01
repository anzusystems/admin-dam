import type {
  AnzuUserAndTimeTrackingAware,
  AssetFileImagePreviewNullable,
  AssetFileLinks,
  DatetimeUTCNullable,
  DocId,
  IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { PodcastModeType } from '@/model/coreDam/valueObject/PodcastMode'
import type { PodcastLastImportStatusType } from '@/model/coreDam/valueObject/PodcastLastImportStatus'

interface Texts {
  title: string
  description: string
}

interface Flags {
  webPublicExportEnabled: boolean
  mobilePublicExportEnabled: boolean
}

export interface Attributes {
  rssUrl: string
  extUrl: string
  webOrderPosition: number
  mobileOrderPosition: number
  mode: PodcastModeType
  lastImportStatus: PodcastLastImportStatusType
}

interface Dates {
  importFrom: DatetimeUTCNullable
}

export interface Podcast extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  licence: IntegerIdNullable
  texts: Texts
  attributes: Attributes
  flags: Flags
  dates: Dates
  exportData: PodcastExportData[]
  links?: AssetFileLinks
  altLinks?: AssetFileLinks
  imagePreview: AssetFileImagePreviewNullable
  altImage: AssetFileImagePreviewNullable
}

export interface PodcastMinimal {
  id: DocId
  title: string
}
