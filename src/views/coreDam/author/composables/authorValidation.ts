import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { DamAuthor } from '@/types/coreDam/DamAuthor'
import type { ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'

const { required, minLength } = useValidate()

export function useAuthorValidation(author: Ref<DamAuthor>, validationScope: ValidationScope = undefined) {
  const rules = computed(() => ({
    author: {
      name: {
        required,
        minLength: minLength(3),
      },
      identifier: {
        minLength: minLength(3),
      },
    },
  }))
  const v$ = useVuelidate(rules, { author }, { $scope: validationScope })

  return {
    v$,
  }
}
