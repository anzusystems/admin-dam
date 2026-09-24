import { DamAssetType, DamAssetTypeDefault, createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/distributionCategory/api/distributionCategoryApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const listFields = [
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'name' as const, variant: 'startsWith', default: null, type: 'string', render: { skip: true } },
  { name: 'type' as const, mandatory: true, default: DamAssetType.Video, type: 'string', render: { skip: true } },
] satisfies readonly MakeFilterOption[]

const listFilterStore = createFilterStore(listFields)

export function useDistributionCategoryListFilter() {
  const { filterConfig, filterData } = createFilter(listFields, listFilterStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}

export function useDistributionCategoryFilter() {
  const fields = [
    { name: 'name' as const, variant: 'startsWith', default: null, type: 'string' },
    { name: 'type' as const, default: DamAssetTypeDefault, type: 'string' },
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
