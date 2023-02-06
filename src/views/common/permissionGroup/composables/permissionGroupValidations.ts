import { maxLength, minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { Ref } from 'vue'
import type { PermissionGroup } from '@anzusystems/common-admin'

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
