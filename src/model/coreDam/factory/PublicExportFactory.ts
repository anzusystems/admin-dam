import { dateTimeNow } from '@anzusystems/common-admin'
import type { PublicExport } from '@/types/coreDam/PublicExport'
import { ExportTypeDefault } from '@/model/coreDam/valueObject/ExportType'
import { ENTITY } from '@/services/api/coreDam/publicExportApi'
import { SYSTEM_CORE_DAM } from '@/model/systems'

export function usePublicExportFactory() {
  const createDefault = (): PublicExport => {
    return {
      id: 0,
      assetLicence: null,
      slug: '',
      type: ExportTypeDefault,
      createdAt: dateTimeNow(),
      modifiedAt: dateTimeNow(),
      createdBy: 1,
      modifiedBy: 1,
      _resourceName: ENTITY,
      _system: SYSTEM_CORE_DAM,
    }
  }

  return {
    createDefault,
  }
}
