import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const fields = [
  {
    name: 'term' as const,
    apiName: 'text',
    titleT: 'coreDam.asset.filter.text',
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
