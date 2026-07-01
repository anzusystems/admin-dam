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

const distributionFilterStore = createFilterStore(filterFields)

export function useDistributionFilter() {
  const { filterConfig, filterData } = createFilter(filterFields, distributionFilterStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
