import { useValidate } from '@anzusystems/common-admin'
import { useVuelidate } from '@vuelidate/core'
import type { Ref } from 'vue'
import { computed } from 'vue'

import type { DamAssetLicenceExtended } from '@/domains/coreDam/assetLicence/types/AssetLicence'

const { required, minLength, minValue } = useValidate()

export function useAssetLicenceValidation(assetLicence: Ref<DamAssetLicenceExtended>) {
  const rules = computed(() => ({
    assetLicence: {
      name: {
        required,
        minLength: minLength(3),
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
