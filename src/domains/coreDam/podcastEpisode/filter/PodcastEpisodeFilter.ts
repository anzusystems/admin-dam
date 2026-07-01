import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/podcastEpisode/api/podcastEpisodeApi'

export function usePodcastEpisodeListFilter() {
  const filterFields = [
    { name: 'id' as const, default: null, type: 'string' },
    { name: 'title' as const, default: null, type: 'string', variant: 'startsWith', apiName: 'texts.title' },
    {
      name: 'webPublicExportEnabled' as const,
      default: null,
      type: 'boolean',
      apiName: 'flags.webPublicExportEnabled',
    },
    {
      name: 'mobilePublicExportEnabled' as const,
      default: null,
      type: 'boolean',
      apiName: 'flags.mobilePublicExportEnabled',
    },
  ] satisfies readonly MakeFilterOption[]

  const { filterConfig, filterData } = createFilter(filterFields, createFilterStore(filterFields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
