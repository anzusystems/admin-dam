import { createFilter, createFilterStore, type MakeFilterOption } from '@anzusystems/common-admin/labs'
import { SYSTEM_CORE_DAM } from '@/shared/systems'
import { ENTITY } from '@/domains/coreDam/asset/api/imageRoiApi'

const filterFields = [] satisfies readonly MakeFilterOption[]

const filterStore = createFilterStore(filterFields)

export function useImageRoiFilter() {
  const { filterConfig, filterData } = createFilter(filterFields, filterStore, {
    system: SYSTEM_CORE_DAM,
    subject: ENTITY,
  })

  return {
    filterConfig,
    filterData,
  }
}
