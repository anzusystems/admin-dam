import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/videoShowEpisode/api/videoShowEpisodeApi'

const filterFieldsList = [
  { name: 'id' as const, default: null, type: 'string' },
  {
    name: 'title' as const,
    apiName: 'texts.title',
    default: null,
    type: 'string',
    variant: 'startsWith',
  },
  {
    name: 'webPublicExportEnabled' as const,
    apiName: 'flags.webPublicExportEnabled',
    default: null,
    type: 'boolean',
  },
  {
    name: 'mobilePublicExportEnabled' as const,
    apiName: 'flags.mobilePublicExportEnabled',
    default: null,
    type: 'boolean',
  },
] satisfies readonly MakeFilterOption[]

const listFiltersStore = createFilterStore(filterFieldsList)

export function useVideoShowEpisodeListFilter() {
  const { filterConfig, filterData } = createFilter(filterFieldsList, listFiltersStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
