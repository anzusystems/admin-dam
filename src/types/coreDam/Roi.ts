import type { AnzuUserAndTimeTrackingAware, DocId, ResourceNameSystemAware } from '@anzusystems/common-admin'
import type { AssetFileLink } from '@anzusystems/common-admin'

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
    image_roi_example: AssetFileLink[]
  }
}
