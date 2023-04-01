import useVuelidate from '@vuelidate/core'
import type { Ref } from 'vue'
import type { AnzuUser } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'

const { email, required, maxLength, minLength } = useValidate()

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
      person: {
        firstName: { required, minLength: minLength(2), maxLength: maxLength(120) },
        lastName: { required, minLength: minLength(2), maxLength: maxLength(120) },
        fullName: { required, minLength: minLength(3), maxLength: maxLength(242) },
      },
      avatar: {
        color: { minLength: minLength(7), maxLength: maxLength(7) },
        text: { required, minLength: minLength(2), maxLength: maxLength(3) },
      },
    },
  }
  const v$ = useVuelidate(rules, { anzuUser })

  return {
    v$,
  }
}
