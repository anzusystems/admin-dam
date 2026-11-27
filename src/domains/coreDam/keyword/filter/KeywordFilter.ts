import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/keyword/api/keywordApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const listFilterFields = [
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'text' as const, default: null, type: 'string', render: { skip: true } },
  { name: 'reviewed' as const, default: null, type: 'boolean' },
] satisfies readonly MakeFilterOption[]

export function useKeywordListFilter() {
  return createFilter(listFilterFields, createFilterStore(listFilterFields), {
    elastic: true,
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
}

export function useKeywordInnerFilter() {
  const filterFieldsInner = [
    { name: 'text' as const, variant: 'search', default: null, type: 'string' },
  ] satisfies readonly MakeFilterOption[]

  return createFilter(filterFieldsInner, createFilterStore(filterFieldsInner), {
    elastic: true,
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
}
