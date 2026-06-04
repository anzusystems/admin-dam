import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { DocId, IntegerIdNullable, ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'

const { required, minLength, maxLength, minValue } = useValidate()

export const TTS_SYNTHESIZE_TEXT_MIN = 10
export const TTS_SYNTHESIZE_TEXT_MAX = 50_000
export const TTS_SYNTHESIZE_TITLE_MAX = 255

export interface TtsSynthesizeForm {
  text: string
  title: string
  podcasts: DocId[]
}

export function useTtsNarrationRequestSynthesizeValidation(
  form: Ref<TtsSynthesizeForm>,
  extSystemId: Ref<IntegerIdNullable>,
  assetLicenceId: Ref<IntegerIdNullable>,
  validationScope: ValidationScope = undefined
) {
  const rules = computed(() => ({
    form: {
      text: {
        required,
        minLength: minLength(TTS_SYNTHESIZE_TEXT_MIN),
        maxLength: maxLength(TTS_SYNTHESIZE_TEXT_MAX),
      },
      title: {
        maxLength: maxLength(TTS_SYNTHESIZE_TITLE_MAX),
      },
    },
    // ext system only scopes the licence/voice pickers; the licence is what gets sent.
    extSystemId: {
      required,
      minValue: minValue(1),
    },
    assetLicenceId: {
      required,
      minValue: minValue(1),
    },
  }))

  const v$ = useVuelidate(rules, { form, extSystemId, assetLicenceId }, { $scope: validationScope })

  return {
    v$,
  }
}
