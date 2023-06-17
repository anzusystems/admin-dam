import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'

interface Flags {
  reviewed: boolean
}

export interface Keyword extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  extSystem: IntegerId
  flags: Flags
}

export interface KeywordMinimal {
  id: DocId
  name: string
}
