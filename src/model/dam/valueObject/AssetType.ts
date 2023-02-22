import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ValueObjectOption } from '@/types/ValueObject'

export enum AssetType {
  Image = 'image',
  Audio = 'audio',
  Video = 'video',
  Document = 'document',
  Default = Image,
}

export function useAssetType() {
  const { t } = useI18n()

  const assetTypeOptions = ref<ValueObjectOption<AssetType>[]>([
    {
      value: AssetType.Image,
      title: t('coreDam.asset.assetType.image'),
    },
    {
      value: AssetType.Audio,
      title: t('coreDam.asset.assetType.audio'),
    },
    {
      value: AssetType.Video,
      title: t('coreDam.asset.assetType.video'),
    },
    {
      value: AssetType.Document,
      title: t('coreDam.asset.assetType.document'),
    },
  ])

  const getAssetTypeOption = (value: AssetType) => {
    return assetTypeOptions.value.find((item) => item.value === value)
  }

  return {
    assetTypeOptions,
    getAssetTypeOption,
  }
}
