import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { IntegerIdNullable, ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'
import type { TtsSynthesizeRequestDto } from '@/types/coreDam/TtsNarrationRequest'

const { required, minLength, maxLength, minValue } = useValidate()

export const TTS_SYNTHESIZE_TEXT_MIN = 10
export const TTS_SYNTHESIZE_TEXT_MAX = 50_000
export const TTS_SYNTHESIZE_TITLE_MAX = 255

export function useTtsNarrationRequestSynthesizeValidation(
  dto: Ref<TtsSynthesizeRequestDto>,
  extSystemId: Ref<IntegerIdNullable>,
  validationScope: ValidationScope = undefined
) {
  const rules = computed(() => ({
    dto: {
      text: {
        required,
        minLength: minLength(TTS_SYNTHESIZE_TEXT_MIN),
        maxLength: maxLength(TTS_SYNTHESIZE_TEXT_MAX),
      },
      title: {
        maxLength: maxLength(TTS_SYNTHESIZE_TITLE_MAX),
      },
      assetLicence: {
        required,
        minValue: minValue(1),
      },
    },
    // ext system is not sent — it only scopes the licence/voice pickers — but the user must pick it.
    extSystemId: {
      required,
      minValue: minValue(1),
    },
  }))

  const v$ = useVuelidate(rules, { dto, extSystemId }, { $scope: validationScope })

  return {
    v$,
  }
}
