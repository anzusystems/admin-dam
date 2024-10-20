import type { DamUserUpdateDto, UserAuthTypeType } from '@anzusystems/common-admin'
import { UserAuthType, useValidate } from '@anzusystems/common-admin'
import useVuelidate from '@vuelidate/core'
import type { Ref } from 'vue'
import { computed } from 'vue'

export function useUpdateUserValidation(userUpdate: Ref<DamUserUpdateDto>, userAuthType: UserAuthTypeType) {
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
