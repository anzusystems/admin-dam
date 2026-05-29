import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'

const filterFieldsList = [
  { name: 'id' as const, default: null, type: 'integer' },
  { name: 'extId' as const, default: null, type: 'string' },
  { name: 'extSystem' as const, default: null },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFieldsList)

export function useAssetLicenceListFilter() {
  const { filterConfig, filterData } = createFilter(filterFieldsList, listFiltersStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
