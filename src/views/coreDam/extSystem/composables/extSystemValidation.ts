import type { Ref } from 'vue'
import { computed } from 'vue'
import { minLength, required, slug } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { ExtSystem } from '@/types/coreDam/ExtSystem'

export function useExtSystemValidation(extSystem: Ref<ExtSystem>) {
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
