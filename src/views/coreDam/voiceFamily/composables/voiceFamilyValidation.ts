import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'
import type { VoiceFamily } from '@/types/coreDam/VoiceFamily'

const { required, minLength, maxLength, slug } = useValidate()

export function useVoiceFamilyValidation(voiceFamily: Ref<VoiceFamily>, validationScope: ValidationScope = undefined) {
  const rules = computed(() => ({
    voiceFamily: {
      slug: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(255),
        slug,
      },
      displayName: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(255),
      },
      language: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(50),
      },
    },
  }))

  const v$ = useVuelidate(rules, { voiceFamily }, { $scope: validationScope })

  return {
    v$,
  }
}
