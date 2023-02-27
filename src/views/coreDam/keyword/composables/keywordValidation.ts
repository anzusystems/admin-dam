import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { Keyword } from '@/types/coreDam/Keyword'
import type { ValidationScope } from '@anzusystems/common-admin'
import { useValidateMinLength, useValidateRequired } from '@anzusystems/common-admin'

const required = useValidateRequired()
const minLength = useValidateMinLength()

export function useKeywordValidation(keyword: Ref<Keyword>, validationScope: ValidationScope = undefined) {
  const rules = computed(() => ({
    keyword: {
      name: {
        required,
        minLength: minLength(3),
      },
    },
  }))
  const v$ = useVuelidate(rules, { keyword }, { $scope: validationScope })

  return {
    v$,
  }
}
