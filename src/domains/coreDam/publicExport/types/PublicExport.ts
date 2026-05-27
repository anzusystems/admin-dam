import type {
  AnzuUserAndTimeTrackingAware,
  IntegerId,
  IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { ExportTypeType } from '@/domains/coreDam/asset/valueObject/ExportType'

export interface PublicExport extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  assetLicence: IntegerIdNullable
  slug: string
  type: ExportTypeType
}
