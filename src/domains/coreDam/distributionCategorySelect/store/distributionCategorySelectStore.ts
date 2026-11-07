import { sortByPosition } from '@anzusystems/common-admin'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'

import { useDistributionCategorySelectFactory } from '@/domains/coreDam/distributionCategorySelect/factory/DistributionCategorySelectFactory'
import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'

export const useDistributionCategorySelectOneStore = defineStore('distributionCategorySelectOneStore', () => {
  const { createDefault } = useDistributionCategorySelectFactory()

  const distributionCategorySelect = ref<DistributionCategorySelect>(createDefault(0))

  function setDistributionCategorySelect(newDistributionCategorySelect: DistributionCategorySelect) {
    // The sortable options editor renders in array order, so normalise to `position` at ingress.
    newDistributionCategorySelect.options = sortByPosition(newDistributionCategorySelect.options)
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
