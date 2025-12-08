import type {
  AnzuUserAndTimeTrackingAware,
  DocIdNullable,
  IntegerId,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { ExportTypeType } from '@/model/coreDam/valueObject/ExportType'
import type { DeviceTypeType } from '@/model/coreDam/valueObject/DeviceType'
import type { JSONContent } from '@tiptap/core'

export interface PodcastExportData extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  exportType: ExportTypeType
  deviceType: DeviceTypeType
  podcast: DocIdNullable
  body: JSONContent
  position: number
}
