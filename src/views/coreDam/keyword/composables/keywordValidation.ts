import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { DamKeyword } from '@anzusystems/common-admin'
import type { ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'

const { required, minLength } = useValidate()

export function useKeywordValidation(keyword: Ref<DamKeyword>, validationScope: ValidationScope = undefined) {
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
