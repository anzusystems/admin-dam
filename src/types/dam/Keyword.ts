import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { DocId, IntegerId } from '@anzusystems/common-admin'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'

interface Flags {
  reviewed: boolean
}

export interface Keyword extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  extSystem: IntegerId
  flags: Flags
}
