import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import { DamAssetType } from '@anzusystems/common-admin'
import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'

const filterFields = [
  { name: 'id' as const, default: null, type: 'integer' },
  {
    name: 'serviceSlug' as const,
    apiName: 'name',
    titleT: 'coreDam.distributionCategorySelect.filter.name',
    default: [],
    type: 'string',
    variant: 'in',
  },
  { name: 'type' as const, default: DamAssetType.Video, type: 'string', mandatory: true },
] satisfies readonly MakeFilterOption[]

export function useDistributionCategorySelectListFilter() {
  const { filterConfig, filterData } = createFilter(filterFields, createFilterStore(filterFields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
