import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategoryApi'
import type { DamAssetTypeType, Filter } from '@anzusystems/common-admin'
import { DamAssetType, DamAssetTypeDefault, makeFilterHelper, type MakeFilterOptions } from '@anzusystems/common-admin'
import { reactive } from 'vue'

const makeFilter: <T>(options: Partial<MakeFilterOptions<T>>) => Filter<T> = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  name: {
    ...makeFilter({ name: 'name', variant: 'startsWith' }),
  },
  type: {
    ...makeFilter<DamAssetTypeType>({ name: 'type', mandatory: true, default: DamAssetType.Video }),
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
    type: {
      ...makeFilter<DamAssetTypeType>({ name: 'type', default: DamAssetTypeDefault }),
    },
  })
}
