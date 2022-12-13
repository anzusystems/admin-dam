import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { DocId } from '@/types/common'
import type { Link } from '@/types/dam/File'

export interface RegionOfInterest extends UserAndTimeTrackingFields, System {
  id: DocId
  title: string
  position: number
  image: DocId
  pointX: number
  pointY: number
  percentageWidth: number
  percentageHeight: number
  links: Link[]
}
