import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/author/api/authorApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const listFields = (sourceSection: boolean) =>
  [
    { name: 'id' as const, default: null, type: 'string' },
    { name: 'text' as const, default: null, type: 'string', variant: 'search', render: { skip: true } },
    { name: 'identifier' as const, default: null, type: 'string' },
    { name: 'reviewed' as const, default: null, type: 'boolean' },
    { name: 'type' as const, default: null, type: 'string' },
    { name: 'source' as const, default: sourceSection || null, type: 'boolean', render: { skip: sourceSection } },
  ] satisfies readonly MakeFilterOption[]

const authorFields = listFields(false)
const sourceFields = listFields(true)
const authorStore = createFilterStore(authorFields)
const sourceStore = createFilterStore(sourceFields)

// The Sources section lists sources only, so its `source` filter is fixed and not shown.
export function useAuthorListFilter(sourceSection: boolean) {
  return createFilter(sourceSection ? sourceFields : authorFields, sourceSection ? sourceStore : authorStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
    elastic: true,
  })
}

export function useAuthorInnerFilter() {
  const fields = [
    { name: 'text' as const, variant: 'search', default: null, type: 'string' },
    { name: 'canBeCurrentAuthor' as const, default: null, type: 'boolean' },
  ] satisfies readonly MakeFilterOption[]

  return createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
    elastic: true,
  })
}
