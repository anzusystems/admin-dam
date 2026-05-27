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
