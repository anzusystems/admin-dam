import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { DistributionCategorySelect } from '@/types/coreDam/DistributionCategorySelect'

export function useDistributionCategorySelectValidation(distributionCategorySelect: Ref<DistributionCategorySelect>) {
  const rules = computed(() => ({
    distributionCategorySelect: {},
  }))
  const v$ = useVuelidate(rules, { distributionCategorySelect })

  return {
    v$,
  }
}
