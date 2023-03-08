import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { AuthorType } from '@/model/coreDam/valueObject/AuthorType'

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

export interface AuthorMinimal {
  id: DocId
  name: string
}
