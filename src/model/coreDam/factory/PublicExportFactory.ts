import { dateTimeNow } from '@anzusystems/common-admin'
import type { PublicExport } from '@/types/coreDam/PublicExport'
import { ExportTypeDefault } from '@/model/coreDam/valueObject/ExportType'

export function usePublicExportFactory() {
  const createDefault = (): PublicExport => {
    return {
      id: '',
      assetLicence: null,
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
