import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { DocId, IntegerId } from '@/types/common'
import type { System } from '@/types/System'

interface Flags {
  reviewed: boolean
}

export interface Keyword extends UserAndTimeTrackingFields, System {
  id: DocId
  name: string
  extSystem: IntegerId
  flags: Flags
}
