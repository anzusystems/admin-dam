import { reactive } from 'vue'

const filter = reactive({})

export function useDistributionListFilter() {
  return filter
}
