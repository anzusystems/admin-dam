import type { DistributionCategory } from '@/domains/coreDam/distributionCategory/types/DistributionCategory'

const { required, minLength } = useValidate()

export function useDistributionCategoryValidation(distributionCategory: Ref<DistributionCategory>) {
  const rules = computed(() => ({
    distributionCategory: {
      type: {},
      name: {
        required,
        minLength: minLength(2),
      },
    },
  }))
  const v$ = useVuelidate(rules, { distributionCategory })

  return {
    v$,
  }
}
