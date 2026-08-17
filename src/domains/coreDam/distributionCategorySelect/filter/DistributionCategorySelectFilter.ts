import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/distributionCategorySelect/api/distributionCategorySelectApi'
import { DamAssetType } from '@anzusystems/common-admin'
import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'

const filterFields = [
  { name: 'id' as const, default: null, type: 'string' },
  {
    name: 'serviceSlug' as const,
    titleT: 'coreDam.distributionCategorySelect.filter.name',
    default: [],
    type: 'string',
    variant: 'in',
    render: { skip: true },
  },
  { name: 'type' as const, default: DamAssetType.Video, type: 'string', mandatory: true, render: { skip: true } },
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
