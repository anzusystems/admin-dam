import type { DamAuthor, ValidationScope } from '@anzusystems/common-admin'
import { DamAuthorType } from '@anzusystems/common-admin'
import { helpers } from '@vuelidate/validators'

const { required, minLength } = useValidate()

export function useAuthorValidation(author: Ref<DamAuthor>, validationScope: ValidationScope = undefined) {
  const { t } = useI18n()

  const sourceType = helpers.withMessage(
    () => t('coreDam.author.validation.sourceType'),
    (value: string) => !author.value.flags.source || value !== DamAuthorType.None
  )

  const rules = computed(() => ({
    author: {
      name: {
        required,
        minLength: minLength(2),
      },
      identifier: {
        minLength: minLength(2),
      },
      type: {
        sourceType,
      },
    },
  }))
  const v$ = useVuelidate(rules, { author }, { $scope: validationScope })

  return {
    v$,
  }
}
