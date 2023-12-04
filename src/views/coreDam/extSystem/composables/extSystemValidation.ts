import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { DamExtSystem } from '@/types/coreDam/DamExtSystem'
import { useValidate } from '@anzusystems/common-admin'

const { required, minLength, slug } = useValidate()

export function useExtSystemValidation(extSystem: Ref<DamExtSystem>) {
  const rules = computed(() => ({
    extSystem: {
      name: {
        required,
        minLength: minLength(2),
      },
      slug: {
        required,
        slug,
      },
    },
  }))
  const v$ = useVuelidate(rules, { extSystem })

  return {
    v$,
  }
}
