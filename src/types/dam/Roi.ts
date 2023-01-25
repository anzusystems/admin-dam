import type { UserAndTimeTrackingFields } from '@/types/UserAndTimeTrackingFields'
import type { System } from '@/types/System'
import type { DocId } from '@anzusystems/common-admin'
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
  links: {
    image_roi_example: Link[]
  }
}
