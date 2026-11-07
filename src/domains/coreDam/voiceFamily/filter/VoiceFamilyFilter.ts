import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/voiceFamily/api/voiceFamilyApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const filterFieldsList = [
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'displayName' as const, variant: 'startsWith', default: null, type: 'string', render: { skip: true } },
  { name: 'language' as const, default: null, type: 'string' },
  { name: 'active' as const, default: null, type: 'boolean' },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFieldsList)

export function useVoiceFamilyListFilter() {
  return createFilter(filterFieldsList, listFiltersStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
}

export function useVoiceFamilyFilter() {
  const fields = [
    { name: 'displayName' as const, variant: 'startsWith', default: null, type: 'string' },
  ] satisfies readonly MakeFilterOption[]

  return createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
}
