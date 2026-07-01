import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/assetLicenceGroup/api/assetLicenceGroupApi'
import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'

export function useAssetLicenceGroupListFilter() {
  const fields = [{ name: 'id' as const, default: null, type: 'integer' }] satisfies readonly MakeFilterOption[]

  const { filterConfig, filterData } = createFilter(fields, createFilterStore(fields), {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
