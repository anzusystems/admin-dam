import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { DistributionCategoryOption } from '@/types/coreDam/DistributionCategoryOption'
import { useValidateMinLength, useValidateRequired } from '@anzusystems/common-admin'

const required = useValidateRequired()
const minLength = useValidateMinLength()

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
