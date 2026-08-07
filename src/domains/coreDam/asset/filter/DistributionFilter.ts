import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/asset/api/distributionApi'

const filterFields = [
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'distributionService' as const, default: null, type: 'string' },
  {
    name: 'distributionServicesIn' as const,
    apiName: 'distributionService',
    default: [],
    type: 'string',
    variant: 'in',
  },
  {
    name: 'distributionServicesNotIn' as const,
    apiName: 'distributionService',
    default: [],
    type: 'string',
    variant: 'notIn',
  },
] satisfies readonly MakeFilterOption[]

export function useDistributionFilter() {
  // A fresh store per call: this filter is set programmatically by several
  // components at once (sidebar list, the create dialogs, DistributionBlockedBy).
  // Sharing one module-level store let them overwrite each other's criteria.
  const { filterConfig, filterData } = createFilter(filterFields, createFilterStore(filterFields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
