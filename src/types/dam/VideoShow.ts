import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { DocId, IntegerIdNullable } from '@anzusystems/common-admin'
import type { System } from '@/types/System'

interface Texts {
  title: string
}

export interface VideoShow extends UserAndTimeTrackingFields, System {
  id: DocId
  licence: IntegerIdNullable
  texts: Texts
}

export interface VideoShowMinimal {
  id: DocId
  title: string
}
