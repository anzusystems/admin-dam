import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'

const fields = [
  {
    name: 'term' as const,
    apiName: 'text',
    default: null,
    type: 'string',
  },
] satisfies readonly MakeFilterOption[]

const listFilterStore = createFilterStore(fields)

export function useExternalProviderAssetListFilter() {
  const { filterConfig, filterData } = createFilter(fields, listFilterStore, {
    elastic: true,
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
