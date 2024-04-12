import type { Ref } from 'vue'
import { computed } from 'vue'
import type { DamUserUpdateDto } from '@anzusystems/common-admin'
import { UserAuthType, useValidate } from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'

export function useUpdateUserValidation(userUpdate: Ref<DamUserUpdateDto>, userAuthType: UserAuthType) {
  const { required, minLength } = useValidate()

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
