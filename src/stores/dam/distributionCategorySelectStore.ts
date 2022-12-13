import { acceptHMRUpdate, defineStore } from 'pinia'
import { useDistributionCategorySelectFactory } from '@/model/dam/factory/DistributionCategorySelectFactory'
import type { DistributionCategorySelect } from '@/types/dam/DistributionCategorySelect'

const { createDefault } = useDistributionCategorySelectFactory()

interface State {
  distributionCategorySelect: DistributionCategorySelect
  loaded: boolean
}

export const useDistributionCategorySelectOneStore = defineStore('distributionCategorySelectOneStore', {
  state: (): State => ({
    distributionCategorySelect: createDefault(0),
    loaded: false,
  }),
  actions: {
    setDistributionCategorySelect(distributionCategorySelect: DistributionCategorySelect) {
      this.distributionCategorySelect = distributionCategorySelect
    },
    setLoaded(loaded: boolean) {
      this.loaded = loaded
    },
    reset() {
      this.distributionCategorySelect = createDefault(0)
      this.loaded = false
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionCategorySelectOneStore, import.meta.hot))
}
