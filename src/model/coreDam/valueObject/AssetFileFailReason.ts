import { AssetFileFailReason, type AssetFileFailReasonType, type ValueObjectOption } from '@anzusystems/common-admin'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export function useAssetFileFailReason() {
  const { t } = useI18n()

  const assetFileFailReasonOptions = ref<ValueObjectOption<AssetFileFailReasonType>[]>([
    {
      value: AssetFileFailReason.None,
      title: t('coreDam.asset.assetFileFailReason.none'),
    },
    {
      value: AssetFileFailReason.Unknown,
      title: t('coreDam.asset.assetFileFailReason.unknown'),
    },
    {
      value: AssetFileFailReason.InvalidChecksum,
      title: t('coreDam.asset.assetFileFailReason.invalidChecksum'),
    },
    {
      value: AssetFileFailReason.InvalidMimeType,
      title: t('coreDam.asset.assetFileFailReason.invalidMimeType'),
    },
    {
      value: AssetFileFailReason.DownloadFailed,
      title: t('coreDam.asset.assetFileFailReason.downloadFailed'),
    },
    {
      value: AssetFileFailReason.InvalidSize,
      title: t('coreDam.asset.assetFileFailReason.invalidSize'),
    },
  ])

  const getAssetFileFailReasonOption = (value: AssetFileFailReasonType) => {
    return assetFileFailReasonOptions.value.find((item) => item.value === value)
  }

  return {
    assetFileFailReasonOptions,
    getAssetFileFailReasonOption,
  }
}
