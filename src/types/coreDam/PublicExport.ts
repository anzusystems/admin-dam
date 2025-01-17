import type {
  AnzuUserAndTimeTrackingAware,
  IntegerId, IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { ExportTypeType } from '@/model/coreDam/valueObject/ExportType'

export interface PublicExport extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  assetLicence: IntegerIdNullable
  slug: string
  type: ExportTypeType
}
