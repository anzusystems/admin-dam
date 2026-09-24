import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export function useAssetLicenceGroupListFilter() {
  const fields = [
    { name: 'id' as const, default: null, type: 'integer', render: { skip: true } },
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
