import type { DamAssetLicence } from '@anzusystems/common-admin'

const { required, minLength } = useValidate()

export function useAssetLicenceValidation(assetLicence: Ref<DamAssetLicence>) {
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
