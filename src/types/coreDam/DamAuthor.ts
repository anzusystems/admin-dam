import type { AnzuUserAndTimeTrackingAware, DocId, IntegerId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { AuthorType } from '@/model/coreDam/valueObject/AuthorType'

interface Flags {
  reviewed: boolean
}

export interface DamAuthorMinimal {
  id: DocId
  name: string
  identifier: string
}

export interface DamAuthor extends DamAuthorMinimal, AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  extSystem: IntegerId
  flags: Flags
  type: AuthorType
}
