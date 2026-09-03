import { helpers } from '@vuelidate/validators'
import type { AssetListView } from '@/domains/coreDam/assetListView/types/AssetListView'

// Mirrors backend AssetLicence::COLLECTION_MAX.
const LICENCES_MAX = 20

export function useAssetListViewValidation(assetListView: Ref<AssetListView>) {
  const { t } = useI18n()
  const { required, minLength, maxLength, minValue } = useValidate()

  const uploadLicenceInLicences = helpers.withMessage(
    () => t('coreDam.assetListView.validation.uploadLicence'),
    (value: IntegerIdNullable) => isNull(value) || assetListView.value.licences.includes(value)
  )

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
      uploadLicence: {
        uploadLicenceInLicences,
      },
    },
  }))
  const v$ = useVuelidate(rules, { assetListView })

  return {
    v$,
  }
}
