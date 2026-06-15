import type { PublicExport } from '@/domains/coreDam/publicExport/types/PublicExport'
import { ExportTypeDefault } from '@/domains/coreDam/asset/valueObject/ExportType'
import { ENTITY } from '@/domains/coreDam/publicExport/api/publicExportApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export function usePublicExportFactory() {
  const createDefault = (): PublicExport => {
    return {
      id: 0,
      assetLicence: null,
      licences: [],
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
