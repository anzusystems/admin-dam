import { ENTITY } from '@/domains/coreDam/publicExport/api/publicExportApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'

export function usePublicExportListFilter() {
  const fields = [
    { name: 'id' as const, default: null, type: 'string' },
    { name: 'type' as const, default: null, type: 'string' },
    { name: 'slug' as const, default: null, type: 'string', variant: 'startsWith' },
  ] satisfies readonly MakeFilterOption[]

  const { filterConfig, filterData } = createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
