import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
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

export function useAuthorListFilter(sourceSection: boolean) {
  const fields = sourceSection ? sourceFields : authorFields
  const { filterConfig, filterData } = createFilter(fields, sourceSection ? sourceStore : authorStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
    elastic: true,
  })

  return { filterConfig, filterData }
}

export function useAuthorInnerFilter() {
  const fields = [
    { name: 'text' as const, variant: 'search', default: null, type: 'string' },
    // Merged authors are not offered; the API keeps canBeCurrentAuthor false exactly for authors with current authors.
    { name: 'canBeCurrentAuthor' as const, default: true, type: 'boolean' },
    { name: 'source' as const, default: null, type: 'boolean', render: { skip: true } },
  ] satisfies readonly MakeFilterOption[]

  const { filterConfig, filterData } = createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
    elastic: true,
  })

  return { filterConfig, filterData }
}
