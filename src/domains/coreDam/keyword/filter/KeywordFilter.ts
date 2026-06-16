import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/keyword/api/keywordApi'

const listFilterFields = [
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'text' as const, default: null, type: 'string' },
  { name: 'reviewed' as const, default: null, type: 'boolean' },
] satisfies readonly MakeFilterOption[]

export function useKeywordListFilter() {
  const { filterConfig, filterData } = createFilter(listFilterFields, createFilterStore(listFilterFields), {
    elastic: true,
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}

export function useKeywordInnerFilter() {
  const filterFieldsInner = [
    { name: 'text' as const, variant: 'search', default: null, type: 'string' },
  ] satisfies readonly MakeFilterOption[]

  const { filterConfig, filterData } = createFilter(filterFieldsInner, createFilterStore(filterFieldsInner), {
    elastic: true,
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
