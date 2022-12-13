import type { Ref } from 'vue'
import { computed } from 'vue'
import { minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { Author } from '@/types/dam/Author'

export function useAuthorValidation(author: Ref<Author>) {
  const rules = computed(() => ({
    author: {
      name: {
        required,
        minLength: minLength(3),
      },
      identifier: {
        minLength: minLength(3),
      },
    },
  }))
  const v$ = useVuelidate(rules, { author })

  return {
    v$,
  }
}
