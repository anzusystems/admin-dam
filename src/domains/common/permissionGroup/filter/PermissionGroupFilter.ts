import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/common/permissionGroup/api/permissionGroupApi'

const filterFieldsList = [
  { name: 'id' as const, default: null, type: 'integer' },
  { name: 'title' as const, default: null, type: 'string', render: { skip: true } },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFieldsList)

export function usePermissionGroupListFilter() {
  return createFilter(filterFieldsList, listFiltersStore, {
    system: 'common',
    subject: ENTITY,
  })
}

export function usePermissionGroupFilter() {
  const filterFieldsInner = [
    { name: 'title' as const, variant: 'startsWith', default: null, type: 'string' },
  ] satisfies readonly MakeFilterOption[]

  return createFilter(filterFieldsInner, createFilterStore(filterFieldsInner), {
    system: 'common',
    subject: ENTITY,
  })
}
