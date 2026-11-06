import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'

// Mirrors backend AssetLicence::COLLECTION_MAX.
const LICENCES_MAX = 20

export function useAssetListViewValidation(assetListView: Ref<AssetListView>) {
  const { required, minLength, maxLength, minValue } = useValidate()

  const rules = computed(() => ({
    assetListView: {
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
        maxLength: maxLength(LICENCES_MAX),
      },
    },
  }))
  const v$ = useVuelidate(rules, { assetListView })

  return {
    v$,
  }
}
