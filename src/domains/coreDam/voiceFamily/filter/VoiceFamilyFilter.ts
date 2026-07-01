import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/voiceFamily/api/voiceFamilyApi'

const filterFieldsList = [
  { name: 'id' as const, default: null, type: 'string' },
  { name: 'displayName' as const, variant: 'startsWith', default: null, type: 'string' },
  { name: 'language' as const, default: null, type: 'string' },
  { name: 'active' as const, default: null, type: 'boolean' },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFieldsList)

export function useVoiceFamilyListFilter() {
  const { filterConfig, filterData } = createFilter(filterFieldsList, listFiltersStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}

export function useVoiceFamilyFilter() {
  const fields = [
    { name: 'displayName' as const, variant: 'startsWith', default: null, type: 'string' },
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
