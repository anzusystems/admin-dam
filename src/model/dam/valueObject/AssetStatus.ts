import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum AssetStatus {
  Draft = 'draft',
  WithFile = 'with_file',
  Deleting = 'deleting',
  Default = Draft,
}

export function useAssetStatus() {
  const { t } = useI18n()

  const assetStatusOptions = ref<ValueObjectOption<AssetStatus>[]>([
    {
      value: AssetStatus.Draft,
      title: t('coreDam.asset.assetStatus.draft'),
    },
    {
      value: AssetStatus.WithFile,
      title: t('coreDam.asset.assetStatus.withFile'),
    },
    {
      value: AssetStatus.Deleting,
      title: t('coreDam.asset.assetStatus.deleting'),
    },
  ])

  const getAssetStatusOption = (value: AssetStatus) => {
    return assetStatusOptions.value.find((item) => item.value === value)
  }

  return {
    assetStatusOptions,
    getAssetStatusOption,
  }
}
