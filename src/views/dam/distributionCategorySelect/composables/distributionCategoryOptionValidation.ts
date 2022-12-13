import type { Ref } from 'vue'
import { computed } from 'vue'
import { minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { DistributionCategoryOption } from '@/types/dam/DistributionCategoryOption'

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
