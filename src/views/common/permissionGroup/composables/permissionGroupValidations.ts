import useVuelidate from '@vuelidate/core'
import type { Ref } from 'vue'
import type { PermissionGroup } from '@anzusystems/common-admin'
import { useValidateMaxLength, useValidateMinLength, useValidateRequired } from '@anzusystems/common-admin'

const required = useValidateRequired()
const minLength = useValidateMinLength()
const maxLength = useValidateMaxLength()

export function usePermissionGroupValidation(permissionGroup: Ref<PermissionGroup>) {
  const rules = {
    permissionGroup: {
      title: {
        required,
        minLength: minLength(3),
        maxLength: maxLength(255),
      },
      description: {
        maxLength: maxLength(2000),
      },
    },
  }
  const v$ = useVuelidate(rules, { permissionGroup })

  return {
    v$,
  }
}
