import type { Ref } from 'vue'
import { computed } from 'vue'
import { maxLength, minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { PermissionGroup } from '@/types/dam/PermissionGroup'

export function usePermissionGroupValidation(permissionGroup: Ref<PermissionGroup>) {
  const rules = computed(() => ({
    permissionGroup: {
      title: {
        required,
        minLength: minLength(3),
        maxLength: maxLength(255),
      },
      description: {
        maxLength: maxLength(255),
      },
    },
  }))
  const v$ = useVuelidate(rules, { permissionGroup })

  return {
    v$,
  }
}
