import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'

const { required, minLength, maxLength } = useValidate()

export const TTS_SYNTHESIZE_TEXT_MIN = 10
export const TTS_SYNTHESIZE_TEXT_MAX = 50_000

export interface TtsSynthesizeForm {
  text: string
}

export function useTtsNarrationRequestSynthesizeValidation(
  form: Ref<TtsSynthesizeForm>,
  validationScope: ValidationScope = undefined
) {
  const rules = computed(() => ({
    form: {
      text: {
        required,
        minLength: minLength(TTS_SYNTHESIZE_TEXT_MIN),
        maxLength: maxLength(TTS_SYNTHESIZE_TEXT_MAX),
      },
    },
  }))

  const v$ = useVuelidate(rules, { form }, { $scope: validationScope })

  return {
    v$,
  }
}
