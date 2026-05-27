import { DamAssetStatus, type DamAssetStatusType } from '@anzusystems/common-admin'

export function useAssetStatus() {
  const { t } = useI18n()

  const assetStatusOptions = ref<ValueObjectOption<DamAssetStatusType>[]>([
    {
      value: DamAssetStatus.Draft,
      title: t('coreDam.asset.assetStatus.draft'),
    },
    {
      value: DamAssetStatus.WithFile,
      title: t('coreDam.asset.assetStatus.withFile'),
    },
    {
      value: DamAssetStatus.Deleting,
      title: t('coreDam.asset.assetStatus.deleting'),
    },
  ])

  const getAssetStatusOption = (value: DamAssetStatusType) => {
    return assetStatusOptions.value.find((item) => item.value === value)
  }

  return {
    assetStatusOptions,
    getAssetStatusOption,
  }
}
