import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/ttsNarrationRequest/api/ttsNarrationRequestApi'

const fields = [
  { name: 'status' as const, variant: 'in', default: [], type: 'string' },
  { name: 'voiceFamilySlug' as const, default: null, type: 'string' },
] satisfies readonly MakeFilterOption[]

const store = createFilterStore(fields)

export function useTtsNarrationRequestListFilter() {
  const { filterConfig, filterData } = createFilter(fields, store, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
