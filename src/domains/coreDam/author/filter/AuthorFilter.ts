import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { ENTITY } from '@/domains/coreDam/author/api/authorApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const fields = [
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'text' as const, default: null, type: 'string' },
  { name: 'identifier' as const, default: null, type: 'string' },
  { name: 'reviewed' as const, default: null, type: 'boolean' },
  { name: 'type' as const, default: null, type: 'string' },
] satisfies readonly MakeFilterOption[]

const store = createFilterStore(fields)

export function useAuthorListFilter() {
  const { filterConfig, filterData } = createFilter(fields, store, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
    elastic: true,
  })

  return { filterConfig, filterData }
}

export function useAuthorInnerFilter() {
  const fields = [
    { name: 'text' as const, variant: 'search', default: null, type: 'string' },
    { name: 'canBeCurrentAuthor' as const, default: null, type: 'boolean' },
  ] satisfies readonly MakeFilterOption[]

  const { filterConfig, filterData } = createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
    elastic: true,
  })

  return { filterConfig, filterData }
}
