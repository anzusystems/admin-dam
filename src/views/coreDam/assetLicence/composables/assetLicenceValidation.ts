import type { Ref } from 'vue'
import { computed } from 'vue'
import useVuelidate from '@vuelidate/core'
import type { AssetLicence } from '@/types/coreDam/AssetLicence'
import { useValidate } from '@anzusystems/common-admin'

const { required, minLength } = useValidate()

export function useAssetLicenceValidation(assetLicence: Ref<AssetLicence>) {
  const rules = computed(() => ({
    assetLicence: {
      name: {
        required,
        minLength: minLength(3),
      },
    },
  }))
  const v$ = useVuelidate(rules, { assetLicence })

  return {
    v$,
  }
}
