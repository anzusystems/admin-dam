import type { DistributionCategoryOption } from '@/domains/coreDam/distributionCategory/types/DistributionCategoryOption'

const { required, minLength } = useValidate()

export function useDistributionCategoryOptionValidation(distributionCategoryOption: Ref<DistributionCategoryOption>) {
  const rules = computed(() => ({
    distributionCategoryOption: {
      name: {
        required,
        minLength: minLength(2),
      },
      value: {
        required,
        minLength: minLength(1),
      },
    },
  }))
  const v$ = useVuelidate(rules, { distributionCategoryOption })

  return {
    v$,
  }
}
