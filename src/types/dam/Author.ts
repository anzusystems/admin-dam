import type { DocId, IntegerId } from '@anzusystems/common-admin'
import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { AuthorType } from '@/model/dam/valueObject/AuthorType'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'

interface Flags {
  reviewed: boolean
}

export interface Author extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  name: string
  identifier: string
  extSystem: IntegerId
  flags: Flags
  type: AuthorType
}
