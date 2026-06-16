import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'
import type { ElevenlabsVoice, GoogleTtsVoice } from '@/domains/coreDam/voiceFamily/types/Voice'

const { required, minLength, maxLength, minValue, maxValue } = useValidate()

export function useVoiceElevenlabsValidation(
  voice: Ref<ElevenlabsVoice>,
  validationScope: ValidationScope = undefined
) {
  const rules = computed(() => ({
    voice: {
      externalVoiceId: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(255),
      },
      modelId: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(64),
      },
      stability: {
        required,
        minValue: minValue(0),
        maxValue: maxValue(1),
      },
      similarityBoost: {
        required,
        minValue: minValue(0),
        maxValue: maxValue(1),
      },
    },
  }))

  const v$ = useVuelidate(rules, { voice }, { $scope: validationScope })

  return { v$ }
}

export function useVoiceGoogleTtsValidation(voice: Ref<GoogleTtsVoice>, validationScope: ValidationScope = undefined) {
  const rules = computed(() => ({
    voice: {
      externalVoiceId: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(255),
      },
      ssmlGender: {
        required,
      },
      speakingRate: {
        required,
        minValue: minValue(0.25),
        maxValue: maxValue(4.0),
      },
      pitch: {
        required,
        minValue: minValue(-20),
        maxValue: maxValue(20),
      },
    },
  }))

  const v$ = useVuelidate(rules, { voice }, { $scope: validationScope })

  return { v$ }
}
