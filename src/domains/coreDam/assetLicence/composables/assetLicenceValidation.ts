import type { Ref } from 'vue'
import { helpers } from '@vuelidate/validators'
import type { DamAssetLicenceExtended } from '@/domains/coreDam/assetLicence/types/AssetLicence'

export const BADGE_MAX_LENGTH = 4

const { required, minLength, maxLength, minValue } = useValidate()

export function useAssetLicenceValidation(assetLicence: Ref<DamAssetLicenceExtended>) {
  const { t } = useI18n()

  const badgeFormat = helpers.withMessage(
    () => t('coreDam.assetLicence.validation.badge'),
    helpers.regex(/^[A-Z0-9]*$/)
  )

  const rules = computed(() => ({
    assetLicence: {
      name: {
        required,
        minLength: minLength(2),
      },
      badge: {
        maxLength: maxLength(BADGE_MAX_LENGTH),
        format: badgeFormat,
      },
      autoDelete: {
        olderThanDays: assetLicence.value.autoDelete.active
          ? {
              required,
              minValue: minValue(2),
            }
          : {},
      },
    },
  }))
  const v$ = useVuelidate(rules, { assetLicence })

  return {
    v$,
  }
}
