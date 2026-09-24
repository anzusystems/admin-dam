import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/user/api/userApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export function useUserListFilter() {
  const fields = [
    { name: 'id' as const, default: null, type: 'integer' },
    { name: 'email' as const, default: null, type: 'string', variant: 'startsWith', render: { skip: true } },
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

export function useUserFilter() {
  const fields = [
    { name: 'email' as const, default: null, type: 'string', variant: 'startsWith', render: { skip: true } },
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
