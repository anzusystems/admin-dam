import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { ENTITY } from '@/domains/common/permissionGroup/api/permissionGroupApi'

const filterFieldsList = [
  { name: 'id' as const, default: null, type: 'integer' },
  { name: 'title' as const, default: null, type: 'string' },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFieldsList)

export function usePermissionGroupListFilter() {
  const { filterConfig, filterData } = createFilter(filterFieldsList, listFiltersStore, {
    system: 'common',
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}

export function usePermissionGroupFilter() {
  const filterFieldsInner = [
    { name: 'title' as const, variant: 'startsWith', default: null, type: 'string' },
  ] satisfies readonly MakeFilterOption[]

  const { filterConfig, filterData } = createFilter(filterFieldsInner, createFilterStore(filterFieldsInner), {
    system: 'common',
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
