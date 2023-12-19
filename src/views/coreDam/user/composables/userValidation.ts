import type { Ref } from 'vue'
import { computed } from 'vue'
import type { UpdateUser } from '@/types/coreDam/User'
import useVuelidate from '@vuelidate/core'
import { UserAuthType, useValidate } from '@anzusystems/common-admin'

const { required, minLength } = useValidate()

export function useUpdateUserValidation(userUpdate: Ref<UpdateUser>, userAuthType: UserAuthType) {
  const rulesRaw = {} as Record<string, any> // todo find better type

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
