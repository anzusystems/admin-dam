import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/asset/api/assetSlotApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

const filterFields = [] satisfies readonly MakeFilterOption[]

const filterStore = createFilterStore(filterFields)

export function useAssetSlotFilter() {
  const { filterConfig, filterData } = createFilter(filterFields, filterStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
