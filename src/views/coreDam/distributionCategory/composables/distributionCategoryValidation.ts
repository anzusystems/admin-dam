import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { DistributionCategory } from '@/types/coreDam/DistributionCategory'
import { useValidateMinLength, useValidateRequired } from '@anzusystems/common-admin'

const required = useValidateRequired()
const minLength = useValidateMinLength()

export function useDistributionCategoryValidation(distributionCategory: Ref<DistributionCategory>) {
  const rules = computed(() => ({
    distributionCategory: {
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
