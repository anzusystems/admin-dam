import type { DistributionCategorySelect } from '@/domains/coreDam/distributionCategorySelect/types/DistributionCategorySelect'

export function useDistributionCategorySelectValidation(distributionCategorySelect: Ref<DistributionCategorySelect>) {
  const rules = computed(() => ({
    distributionCategorySelect: {},
  }))
  const v$ = useVuelidate(rules, { distributionCategorySelect })

  return {
    v$,
  }
}
