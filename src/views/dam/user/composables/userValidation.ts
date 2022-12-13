import type { Ref } from 'vue'
import { computed } from 'vue'
import type { CreateUser, UpdateUser } from '@/types/dam/User'
import { email, maxLength, minLength, required } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'

export function useCreateUserValidation(userCreate: Ref<CreateUser>) {
  const rules = computed(() => ({
    userCreate: {
      firstName: {
        maxLength: maxLength(120),
      },
      lastName: {
        maxLength: maxLength(120),
      },
      email: {
        required,
        email,
      },
      plainPassword: {
        required,
        minLength: minLength(8),
      },
    },
  }))
  const v$ = useVuelidate(rules, { userCreate })

  return {
    v$,
  }
}

export function useUpdateUserValidation(userUpdate: Ref<UpdateUser>) {
  const rules = computed(() => ({
    userUpdate: {
      firstName: {
        maxLength: maxLength(120),
      },
      lastName: {
        maxLength: maxLength(120),
      },
      plainPassword: {
        minLength: minLength(8),
      },
    },
  }))
  const v$ = useVuelidate(rules, { userUpdate })

  return {
    v$,
  }
}
