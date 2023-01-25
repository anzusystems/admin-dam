import type { DocId, IntegerId } from '@anzusystems/common-admin'
import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { AuthorType } from '@/model/dam/valueObject/AuthorType'
import type { System } from '@/types/System'

interface Flags {
  reviewed: boolean
}

export interface Author extends UserAndTimeTrackingFields, System {
  id: DocId
  name: string
  identifier: string
  extSystem: IntegerId
  flags: Flags
  type: AuthorType
}
