import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { AuthorType } from '@/model/coreDam/valueObject/AuthorType'

interface Flags {
  reviewed: boolean
}

export interface AuthorMinimal {
  id: DocId
  name: string
  identifier: string
}

export interface Author extends AuthorMinimal, AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  extSystem: IntegerId
  flags: Flags
  type: AuthorType
}
