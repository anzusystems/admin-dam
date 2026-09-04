import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/assetListView/api/assetListViewApi'
import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'

export function useAssetListViewListFilter() {
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
