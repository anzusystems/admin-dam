import type { Ref } from 'vue'
import { computed } from 'vue'
import type { UpdateUser } from '@/types/coreDam/User'
import useVuelidate from '@vuelidate/core'
import { UserAuthType } from '@/types/coreDam/DamConfig'
import { useValidateMaxLength, useValidateMinLength, useValidateRequired } from '@anzusystems/common-admin'

const required = useValidateRequired()
const minLength = useValidateMinLength()
const maxLength = useValidateMaxLength()

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
