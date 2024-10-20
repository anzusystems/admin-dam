import { DamAssetType, type DamAssetTypeType, type ValueObjectOption } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useAssetType() {
  const { t } = useI18n()

  const assetTypeOptions = ref<ValueObjectOption<DamAssetTypeType>[]>([
    {
      value: DamAssetType.Image,
      title: t('coreDam.asset.assetType.image'),
    },
    {
      value: DamAssetType.Audio,
      title: t('coreDam.asset.assetType.audio'),
    },
    {
      value: DamAssetType.Video,
      title: t('coreDam.asset.assetType.video'),
    },
    {
      value: DamAssetType.Document,
      title: t('coreDam.asset.assetType.document'),
    },
  ])

  const getAssetTypeOption = (value: DamAssetTypeType) => {
    return assetTypeOptions.value.find((item) => item.value === value)
  }

  return {
    assetTypeOptions,
    getAssetTypeOption,
  }
}
