import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/authorCleanPhrase/api/AuthorCleanPhraseApi'
import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'

export function useAuthorCleanPhraseListFilter() {
  const fields = [
    { name: 'id' as const, default: null, type: 'string' },
    { name: 'phrase' as const, default: null, type: 'string' },
    { name: 'mode' as const, default: null, type: 'string' },
    { name: 'type' as const, default: null, type: 'string' },
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
