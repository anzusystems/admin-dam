import type { Filter } from '@anzusystems/common-admin'
import { makeFilterHelper, type MakeFilterOptions } from '@anzusystems/common-admin'
import { reactive } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/dam/distributionCategorySelectApi'
import { AssetType } from '@/model/dam/valueObject/AssetType'

const makeFilter: <T>(options: Partial<MakeFilterOptions<T>>) => Filter<T> = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  serviceSlug: {
    ...makeFilter<string[]>({ name: 'name', variant: 'in' }),
  },
  type: {
    ...makeFilter<AssetType>({ name: 'type', mandatory: true, default: AssetType.Video }),
  },
})

export function useDistributionCategorySelectListFilter() {
  return filter
}
