import type { DamAuthor, ValidationScope } from '@anzusystems/common-admin'

const { required, minLength, between } = useValidate()

export const PRIORITY_MAX = 1000

export function useAuthorValidation(author: Ref<DamAuthor>, validationScope: ValidationScope = undefined) {
  const rules = computed(() => ({
    author: {
      name: {
        required,
        minLength: minLength(2),
      },
      identifier: {
        minLength: minLength(2),
      },
      priority: {
        required,
        between: between(0, PRIORITY_MAX),
      },
    },
  }))
  const v$ = useVuelidate(rules, { author }, { $scope: validationScope })

  return {
    v$,
  }
}
