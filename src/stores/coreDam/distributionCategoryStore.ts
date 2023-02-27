import { acceptHMRUpdate, defineStore } from 'pinia'
import { useDistributionCategoryFactory } from '@/model/coreDam/factory/DistributionCategoryFactory'
import type { DistributionCategory } from '@/types/coreDam/DistributionCategory'
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import type { DistributionServiceName } from '@/types/coreDam/DamConfig'

const { createDefault } = useDistributionCategoryFactory()

interface State {
  distributionCategory: DistributionCategory
  distributionCategorySelects: DistributionCategorySelect[]
  distributionCategorySelectedOptions: Partial<Record<DistributionServiceName, DistributionCategoryOption | null>>
}

export const useDistributionCategoryOneStore = defineStore('distributionCategoryOneStore', {
  state: (): State => ({
    distributionCategory: createDefault(0),
    distributionCategorySelects: [],
    distributionCategorySelectedOptions: {},
  }),
  actions: {
    setDistributionCategory(distributionCategory: DistributionCategory, selects: DistributionCategorySelect[]) {
      this.distributionCategory = distributionCategory
      this.distributionCategorySelects = selects
      selects.forEach((select) => {
        this.distributionCategorySelectedOptions[select.serviceSlug] =
          distributionCategory.selectedOptionsDetail.find((option) => option.serviceSlug === select.serviceSlug) ?? null
      })
    },
    reset() {
      this.distributionCategory = createDefault(0)
      this.distributionCategorySelects = []
      this.distributionCategorySelectedOptions = {}
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionCategoryOneStore, import.meta.hot))
}
