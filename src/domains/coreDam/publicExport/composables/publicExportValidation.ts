import type { ValidationScope } from '@anzusystems/common-admin'
import type { PublicExport } from '@/domains/coreDam/publicExport/types/PublicExport'

const { required, minLength } = useValidate()

export function usePublicExportValidation(
  publicExport: Ref<PublicExport>,
  validationScope: ValidationScope = undefined
) {
  const rules = computed(() => ({
    publicExport: {
      slug: {
        required,
        minLength: minLength(2),
      },
      licences: {
        required,
        minLength: minLength(1),
      },
      type: {
        required,
      },
    },
  }))
  const v$ = useVuelidate(rules, { publicExport }, { $scope: validationScope })

  return {
    v$,
  }
}
