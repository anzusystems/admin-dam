import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/common/permissionGroup/api/permissionGroupApi'

export function usePermissionGroupFilter() {
  const filterFieldsInner = [
    { name: 'title' as const, variant: 'startsWith', default: null, type: 'string' },
  ] satisfies readonly MakeFilterOption[]

  return createFilter(filterFieldsInner, createFilterStore(filterFieldsInner), {
    system: 'common',
    subject: ENTITY,
  })
}
