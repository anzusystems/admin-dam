import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'
import type { PublicExport } from '@/types/coreDam/PublicExport'

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
      assetLicence: {
        required,
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
