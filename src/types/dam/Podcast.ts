import type {
  AnzuUserAndTimeTrackingAware,
  DocId,
  IntegerIdNullable,
  ResourceNameSystemAware
} from '@anzusystems/common-admin'
import type { PodcastMode } from '@/model/dam/valueObject/PodcastMode'
import type { PodcastLastImportStatus } from '@/model/dam/valueObject/PodcastLastImportStatus'
import type { Links } from '@/types/dam/File'
import type { ImagePreviewNullable } from '@/types/dam/ImagePreview'

interface Texts {
  title: string
  description: string
}

export interface Attributes {
  rssUrl: string
  mode: PodcastMode
  lastImportStatus: PodcastLastImportStatus
}

export interface Podcast extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  licence: IntegerIdNullable
  texts: Texts
  attributes: Attributes
  links?: Links
  imagePreview: ImagePreviewNullable
}

export interface PodcastMinimal {
  id: DocId
  title: string
}
