import type {
  AnzuUserAndTimeTrackingAware,
  DocId,
  IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { PodcastMode } from '@/model/coreDam/valueObject/PodcastMode'
import type { PodcastLastImportStatus } from '@/model/coreDam/valueObject/PodcastLastImportStatus'

interface Texts {
  title: string
}

interface Flags {
  webPublicExportEnabled: boolean
  mobilePublicExportEnabled: boolean
}

export interface Attributes {
  webOrderPosition: number
  mobileOrderPosition: number
}

export interface VideoShow extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  licence: IntegerIdNullable
  texts: Texts
  attributes: Attributes
  flags: Flags
}

export interface VideoShowMinimal {
  id: DocId
  title: string
}
