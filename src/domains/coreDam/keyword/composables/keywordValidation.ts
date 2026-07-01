import type { DamKeyword, ValidationScope } from '@anzusystems/common-admin'

const { required, minLength } = useValidate()

export function useKeywordValidation(keyword: Ref<DamKeyword>, validationScope: ValidationScope = undefined) {
  const rules = computed(() => ({
    keyword: {
      name: {
        required,
        minLength: minLength(2),
      },
    },
  }))
  const v$ = useVuelidate(rules, { keyword }, { $scope: validationScope })

  return {
    v$,
  }
}
