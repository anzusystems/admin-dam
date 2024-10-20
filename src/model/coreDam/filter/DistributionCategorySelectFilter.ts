import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategorySelectApi'
import type { DamAssetTypeType, Filter } from '@anzusystems/common-admin'
import { DamAssetType, makeFilterHelper, type MakeFilterOptions } from '@anzusystems/common-admin'
import { reactive } from 'vue'

const makeFilter: <T>(options: Partial<MakeFilterOptions<T>>) => Filter<T> = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  serviceSlug: {
    ...makeFilter<string[]>({ name: 'name', variant: 'in' }),
  },
  type: {
    ...makeFilter<DamAssetTypeType>({ name: 'type', mandatory: true, default: DamAssetType.Video }),
  },
})

export function useDistributionCategorySelectListFilter() {
  return filter
}
