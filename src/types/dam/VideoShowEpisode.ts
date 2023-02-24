import type { AnzuUserAndTimeTrackingAware } from '@anzusystems/common-admin'
import type { DocId, DocIdNullable } from '@anzusystems/common-admin'
import type { ResourceNameSystemAware } from '@anzusystems/common-admin'

interface Texts {
  title: string
}

export interface VideoShowEpisode extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: DocId
  videoShow: DocIdNullable
  asset: DocIdNullable
  texts: Texts
  position: number
}
