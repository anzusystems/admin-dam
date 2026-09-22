import { useDistributionCategoryFactory } from '@/domains/coreDam/distributionCategory/factory/DistributionCategoryFactory'
import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'
import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'
import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'
import type { DamDistributionServiceName } from '@anzusystems/common-admin'

export const useDistributionCategoryOneStore = defineStore('distributionCategoryOneStore', () => {
  const { createDefault } = useDistributionCategoryFactory()

  const distributionCategory = ref<DistributionCategory>(createDefault(0))
  const distributionCategorySelects = ref<DistributionCategorySelect[]>([])
  const distributionCategorySelectedOptions = ref<
    Partial<Record<DamDistributionServiceName, DistributionCategoryOption | null>>
  >({})

  function setDistributionCategory(
    newDistributionCategory: DistributionCategory,
    selects: DistributionCategorySelect[]
  ) {
    distributionCategory.value = newDistributionCategory
    distributionCategorySelects.value = selects
    selects.forEach((select) => {
      distributionCategorySelectedOptions.value[select.serviceSlug] =
        newDistributionCategory.selectedOptionsDetail.find((option) => option.serviceSlug === select.serviceSlug) ??
        null
    })
  }

  function reset() {
    distributionCategory.value = createDefault(0)
    distributionCategorySelects.value = []
    distributionCategorySelectedOptions.value = {}
  }

  return {
    distributionCategory,
    distributionCategorySelects,
    distributionCategorySelectedOptions,
    setDistributionCategory,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionCategoryOneStore, import.meta.hot))
}
