import type { Ref } from 'vue'
import { computed } from 'vue'
import { minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { Keyword } from '@/types/dam/Keyword'

export function useKeywordValidation(keyword: Ref<Keyword>) {
  const rules = computed(() => ({
    keyword: {
      name: {
        required,
        minLength: minLength(3),
      },
    },
  }))
  const v$ = useVuelidate(rules, { keyword })

  return {
    v$,
  }
}
