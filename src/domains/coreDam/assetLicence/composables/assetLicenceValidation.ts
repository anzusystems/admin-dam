import type { Ref } from 'vue'
import type { DamAssetLicenceExtended } from '@/domains/coreDam/assetLicence/types/AssetLicence'
import { useBadgeRules } from '@/domains/coreDam/assetLicence/composables/badgeValidation'

const { required, minLength, minValue } = useValidate()

export function useAssetLicenceValidation(assetLicence: Ref<DamAssetLicenceExtended>) {
  const badgeRules = useBadgeRules()

  const rules = computed(() => ({
    assetLicence: {
      name: {
        required,
        minLength: minLength(2),
      },
      badge: badgeRules,
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
