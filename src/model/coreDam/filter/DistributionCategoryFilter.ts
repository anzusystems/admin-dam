import type { Filter } from '@anzusystems/common-admin'
import { makeFilterHelper, type MakeFilterOptions } from '@anzusystems/common-admin'
import { reactive } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategoryApi'
import { AssetType } from '@/model/coreDam/valueObject/AssetType'

const makeFilter: <T>(options: Partial<MakeFilterOptions<T>>) => Filter<T> = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  name: {
    ...makeFilter({ name: 'name', variant: 'startsWith' }),
  },
  type: {
    ...makeFilter<AssetType>({ name: 'type', mandatory: true, default: AssetType.Video }),
  },
})

export function useDistributionCategoryListFilter() {
  return filter
}

export function useDistributionCategoryFilter() {
  return reactive({
    name: {
      ...makeFilter({ name: 'name', variant: 'startsWith' }),
    },
  })
}
