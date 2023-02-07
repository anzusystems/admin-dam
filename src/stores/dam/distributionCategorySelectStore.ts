import { acceptHMRUpdate, defineStore } from 'pinia'
import { useDistributionCategorySelectFactory } from '@/model/dam/factory/DistributionCategorySelectFactory'
import type { DistributionCategorySelect } from '@/types/dam/DistributionCategorySelect'

const { createDefault } = useDistributionCategorySelectFactory()

interface State {
  distributionCategorySelect: DistributionCategorySelect
}

export const useDistributionCategorySelectOneStore = defineStore('distributionCategorySelectOneStore', {
  state: (): State => ({
    distributionCategorySelect: createDefault(0),
  }),
  actions: {
    setDistributionCategorySelect(distributionCategorySelect: DistributionCategorySelect) {
      this.distributionCategorySelect = distributionCategorySelect
    },
    reset() {
      this.distributionCategorySelect = createDefault(0)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionCategorySelectOneStore, import.meta.hot))
}
