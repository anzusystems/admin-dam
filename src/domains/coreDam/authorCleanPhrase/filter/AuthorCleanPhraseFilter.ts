import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/authorCleanPhrase/api/AuthorCleanPhraseApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export function useAuthorCleanPhraseListFilter() {
  const fields = [
    { name: 'id' as const, default: null, type: 'string' },
    { name: 'phrase' as const, default: null, type: 'string', render: { skip: true } },
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
