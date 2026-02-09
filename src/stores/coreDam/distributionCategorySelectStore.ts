import { acceptHMRUpdate, defineStore } from 'pinia'
import { useDistributionCategorySelectFactory } from '@/model/coreDam/factory/DistributionCategorySelectFactory'
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'
import { ref } from 'vue'

export const useDistributionCategorySelectOneStore = defineStore('distributionCategorySelectOneStore', () => {
  const { createDefault } = useDistributionCategorySelectFactory()

  const distributionCategorySelect = ref<DistributionCategorySelect>(createDefault(0))

  function setDistributionCategorySelect(newDistributionCategorySelect: DistributionCategorySelect) {
    distributionCategorySelect.value = newDistributionCategorySelect
  }

  function reset() {
    distributionCategorySelect.value = createDefault(0)
  }

  return {
    distributionCategorySelect,
    setDistributionCategorySelect,
    reset,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistributionCategorySelectOneStore, import.meta.hot))
}
