import type {
  AnzuUserAndTimeTrackingAware,
  IntegerId,
  IntegerIdNullable,
  ResourceNameSystemAware,
} from '@anzusystems/common-admin'
import type { ExportTypeType } from '@/model/coreDam/valueObject/ExportType'

export interface PublicExport extends AnzuUserAndTimeTrackingAware, ResourceNameSystemAware {
  id: IntegerId
  /** @deprecated use {@link licences}; kept (primary licence) for back-compat */
  assetLicence: IntegerIdNullable
  licences: IntegerId[]
  slug: string
  type: ExportTypeType
}
