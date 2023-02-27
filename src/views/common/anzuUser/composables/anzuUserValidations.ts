import useVuelidate from '@vuelidate/core'
import type { Ref } from 'vue'
import type { AnzuUser } from '@anzusystems/common-admin'
import { useValidateEmail, useValidateMaxLength, useValidateRequired } from '@anzusystems/common-admin'

const email = useValidateEmail()
const required = useValidateRequired()
const maxLength = useValidateMaxLength()

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
