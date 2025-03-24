import type {
  AnzuUserAndTimeTrackingAware,
  DatetimeUTC,
  DocId,
  DocIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'

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

interface Dates {
  publicationDate: DatetimeUTC
}

export interface VideoShowEpisode extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  videoShow: DocIdNullable
  asset: DocIdNullable
  texts: Texts
  attributes: Attributes
  flags: Flags
  dates: Dates
  position: number
}
