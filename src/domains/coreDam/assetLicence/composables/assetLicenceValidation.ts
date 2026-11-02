import type { Ref } from 'vue'
import { helpers } from '@vuelidate/validators'
import type { DamAssetLicenceExtended } from '@/domains/coreDam/assetLicence/types/AssetLicence'

const { required, minLength, maxLength, minValue } = useValidate()

export function useAssetLicenceValidation(assetLicence: Ref<DamAssetLicenceExtended>) {
  const rules = computed(() => ({
    assetLicence: {
      name: {
        required,
        minLength: minLength(2),
      },
      badge: {
        maxLength: maxLength(3),
        format: helpers.regex(/^[A-Z0-9]{0,3}$/),
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
