import type { Ref } from 'vue'
import { computed } from 'vue'
import type { CreateUser, UpdateUser } from '@/types/dam/User'
import { email, maxLength, minLength, minValue, required, numeric } from '@/plugins/validators'
import useVuelidate from '@vuelidate/core'
import { UserAuthType } from '@/types/dam/DamConfig'

export function useCreateUserValidation(userCreate: Ref<CreateUser>, userAuthType: UserAuthType) {
  const rulesRaw = {
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
  } as Record<string, any> // todo find better type
  if (userAuthType === UserAuthType.OAuth2) {
    rulesRaw['id'] = {
      required,
      numeric,
      minValue: minValue(1),
    }
  }
  if (userAuthType === UserAuthType.JsonCredentials) {
    rulesRaw['plainPassword'] = {
      required,
      minLength: minLength(8),
    }
  }

  const rules = computed(() => ({
    userCreate: rulesRaw,
  }))
  const v$ = useVuelidate(rules, { userCreate })

  return {
    v$,
  }
}

export function useUpdateUserValidation(userUpdate: Ref<UpdateUser>, userAuthType: UserAuthType) {
  const rulesRaw = {
    firstName: {
      maxLength: maxLength(120),
    },
    lastName: {
      maxLength: maxLength(120),
    },
  } as Record<string, any> // todo find better type

  if (userAuthType === UserAuthType.JsonCredentials) {
    rulesRaw['plainPassword'] = {
      required,
      minLength: minLength(8),
    }
  }

  const rules = computed(() => ({
    userUpdate: rulesRaw,
  }))
  const v$ = useVuelidate(rules, { userUpdate })

  return {
    v$,
  }
}
