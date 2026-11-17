import type { DamAuthor, ValidationScope } from '@anzusystems/common-admin'

const { required, minLength } = useValidate()

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
    },
  }))
  const v$ = useVuelidate(rules, { author }, { $scope: validationScope })

  return {
    v$,
  }
}
