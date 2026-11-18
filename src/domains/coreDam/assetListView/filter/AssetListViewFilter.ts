import { createFilter, createFilterStore } from '@anzusystems/common-admin'
import type { MakeFilterOption } from '@anzusystems/common-admin'

import { ENTITY } from '@/domains/coreDam/assetListView/api/assetListViewApi'
import { SYSTEM_CORE_DAM } from '@/shared/systems'

export function useAssetListViewListFilter() {
  const fields = [
    { name: 'id' as const, default: null, type: 'integer', render: { skip: true } },
  ] satisfies readonly MakeFilterOption[]

  return createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
}

export function useAssetListViewByGroupFilter() {
  const fields = [
    { name: 'groups' as const, variant: 'memberOf', default: null, render: { skip: true } },
  ] satisfies readonly MakeFilterOption[]

  return createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })
}
