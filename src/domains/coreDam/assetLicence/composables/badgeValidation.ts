import { helpers } from '@vuelidate/validators'

export const BADGE_MAX_LENGTH = 4

const { maxLength } = useValidate()

export function useBadgeRules() {
  const { t } = useI18n()

  return {
    maxLength: maxLength(BADGE_MAX_LENGTH),
    format: helpers.withMessage(() => t('coreDam.assetLicence.validation.badge'), helpers.regex(/^[A-Z0-9]*$/)),
  }
}
