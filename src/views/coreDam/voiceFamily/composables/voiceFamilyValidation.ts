import type { Ref } from 'vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import useVuelidate from '@vuelidate/core'
import { helpers } from '@vuelidate/validators'
import type { ValidationScope } from '@anzusystems/common-admin'
import { useValidate } from '@anzusystems/common-admin'
import type { VoiceFamily } from '@/types/coreDam/VoiceFamily'

const { required, minLength, maxLength, minValue } = useValidate()

export function useVoiceFamilyValidation(voiceFamily: Ref<VoiceFamily>, validationScope: ValidationScope = undefined) {
  const { t } = useI18n()

  // Mirror BE VoiceFamily::$slug exactly: Regex(^[a-z0-9_-]+$). The common-admin `slug` validator is
  // stricter (allows only a-z0-9), so a BE-valid slug like "sme_default_male" would be rejected here.
  const slugFormat = helpers.withMessage(
    () => t('coreDam.voiceFamily.validation.slug'),
    (value: string) => !helpers.req(value) || /^[a-z0-9_-]+$/.test(value)
  )

  const rules = computed(() => ({
    voiceFamily: {
      extSystem: {
        required,
        minValue: minValue(1),
      },
      slug: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(120),
        slugFormat,
      },
      displayName: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(255),
      },
      language: {
        required,
        minLength: minLength(1),
        maxLength: maxLength(16),
      },
    },
  }))

  const v$ = useVuelidate(rules, { voiceFamily }, { $scope: validationScope })

  return {
    v$,
  }
}
