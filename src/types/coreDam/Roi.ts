import type { AnzuUserAndTimeTrackingAware, DocId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { Link } from '@/types/coreDam/File'

export interface RegionOfInterest extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
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
