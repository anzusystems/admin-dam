import { email, maxLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import type { Ref } from 'vue'
import type { AnzuUser } from '@anzusystems/common-admin'

export function useAnzuUserValidation(anzuUser: Ref<AnzuUser>) {
  const rules = {
    anzuUser: {
      id: {
        required,
      },
      email: {
        required,
        email,
        maxLength: maxLength(256),
      },
    },
  }
  const v$ = useVuelidate(rules, { anzuUser })

  return {
    v$,
  }
}
