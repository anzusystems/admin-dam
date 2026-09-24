import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/assetLicence/api/assetLicenceApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const filterFieldsList = [
  { name: 'id' as const, default: null, type: 'integer' },
  { name: 'extId' as const, default: null, type: 'string', render: { skip: true } },
  { name: 'extSystem' as const, titleT: 'coreDam.extSystem.filter.extSystem', default: null },
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
