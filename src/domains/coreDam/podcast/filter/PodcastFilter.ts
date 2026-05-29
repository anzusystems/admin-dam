import {
  createFilter,
  createFilterStore,
  type MakeFilterOption,
} from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/podcast/api/podcastApi'

export function usePodcastListFilter() {
  const fields = [
    {
      name: 'id' as const,
      default: null,
      type: 'string',
    },
    {
      name: 'title' as const,
      apiName: 'texts.title',
      variant: 'startsWith',
      default: null,
      type: 'string',
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

  const { filterConfig, filterData } = createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}

export function usePodcastFilter() {
  const fields = [
    {
      name: 'title' as const,
      apiName: 'texts.title',
      variant: 'startsWith',
      default: null,
      type: 'string',
    },
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
