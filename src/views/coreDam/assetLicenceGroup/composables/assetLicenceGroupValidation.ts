import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import { type DamAssetLicenceGroup, useValidate } from '@anzusystems/common-admin'

export function useAssetLicenceGroupValidation(assetLicenceGroup: Ref<DamAssetLicenceGroup>) {
  const { required, minLength, minValue } = useValidate()

  const rules = computed(() => ({
    assetLicenceGroup: {
      name: {
        required,
        minLength: minLength(3),
      },
      extSystem: {
        required,
        minValue: minValue(1),
      },
      licences: {
        required,
        minLength: minLength(1),
      },
    },
  }))
  const v$ = useVuelidate(rules, { assetLicenceGroup })

  return {
    v$,
  }
}
