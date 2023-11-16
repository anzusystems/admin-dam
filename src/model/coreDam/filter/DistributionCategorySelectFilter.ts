import type { Filter } from '@anzusystems/common-admin'
import { makeFilterHelper, type MakeFilterOptions } from '@anzusystems/common-admin'
import { reactive } from 'vue'
import { SYSTEM_CORE_DAM } from '@/model/systems'
import { ENTITY } from '@/services/api/coreDam/distributionCategorySelectApi'
import { DamAssetType } from '@anzusystems/common-admin'

const makeFilter: <T>(options: Partial<MakeFilterOptions<T>>) => Filter<T> = makeFilterHelper(SYSTEM_CORE_DAM, ENTITY)

const filter = reactive({
  id: {
    ...makeFilter({ name: 'id' }),
  },
  serviceSlug: {
    ...makeFilter<string[]>({ name: 'name', variant: 'in' }),
  },
  type: {
    ...makeFilter<DamAssetType>({ name: 'type', mandatory: true, default: DamAssetType.Video }),
  },
})

export function useDistributionCategorySelectListFilter() {
  return filter
}
