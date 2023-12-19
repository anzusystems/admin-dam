import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DamAssetStatus, type ValueObjectOption } from '@anzusystems/common-admin'

export function useAssetStatus() {
  const { t } = useI18n()

  const assetStatusOptions = ref<ValueObjectOption<DamAssetStatus>[]>([
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

  const getAssetStatusOption = (value: DamAssetStatus) => {
    return assetStatusOptions.value.find((item) => item.value === value)
  }

  return {
    assetStatusOptions,
    getAssetStatusOption,
  }
}
