import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/extSystem/api/extSystemApi'

export function useExtSystemListFilter() {
  const fields = [
    { name: 'id' as const, default: null, type: 'integer' },
    { name: 'name' as const, variant: 'startsWith', default: null, type: 'string' },
    { name: 'slug' as const, variant: 'startsWith', default: null, type: 'string' },
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

export function useExtSystemFilter() {
  const fields = [
    { name: 'name' as const, variant: 'startsWith', default: null, type: 'string' },
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
