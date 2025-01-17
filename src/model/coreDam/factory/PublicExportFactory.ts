import type { IntegerId } from '@anzusystems/common-admin'
import { dateTimeNow } from '@anzusystems/common-admin'
import type { PublicExport } from '@/types/coreDam/PublicExport'
import { ExportTypeDefault } from '@/model/coreDam/valueObject/ExportType'

export function usePublicExportFactory() {
  const createDefault = (assetLicenceId: IntegerId): PublicExport => {
    return {
      id: '',
      assetLicence: assetLicenceId,
      slug: '',
      type: ExportTypeDefault,
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
    }
  }

  return {
    createDefault,
  }
}
