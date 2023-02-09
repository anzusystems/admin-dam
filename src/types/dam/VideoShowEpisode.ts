import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import type { System } from '@/types/System'

interface Texts {
  title: string
}

export interface VideoShowEpisode extends UserAndTimeTrackingFields, System {
  id: DocId
  videoShow: DocIdNullable
  asset: DocIdNullable
  texts: Texts
  position: number
}
