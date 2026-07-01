import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const filterFields = [
  {
    name: 'id' as const,
    default: null,
    type: 'integer',
    titleT: 'common.job.filter.id',
  },
  {
    name: 'status' as const,
    default: [],
    type: 'string',
    variant: 'in',
    titleT: 'common.job.filter.status',
  },
  {
    name: 'startedAtFrom' as const,
    apiName: 'startedAt',
    default: null,
    type: 'timeInterval',
    related: 'startedAtUntil',
    titleT: 'common.job.filter.startedAtFrom',
  },
  {
    name: 'startedAtUntil' as const,
    apiName: 'startedAt',
    default: null,
    type: 'timeInterval',
    exclude: true,
    render: { skip: true },
    titleT: 'common.job.filter.startedAtUntil',
  },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFields)

export function useJobListFilter() {
  const { filterConfig, filterData } = createFilter(filterFields, listFiltersStore, {
    system: SYSTEM_CORE_DAM,
    subject: 'job',
  })

  return {
    filterConfig,
    filterData,
  }
}
