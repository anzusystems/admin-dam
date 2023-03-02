import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export enum AssetFileFailReason {
  None = 'none',
  Unknown = 'unknown',
  InvalidChecksum = 'invalid_checksum',
  InvalidMimeType = 'invalid_mime_type',
  DownloadFailed = 'download_failed',
  InvalidSize = 'invalid_size',
  Default = None,
}

export function useAssetFileFailReason() {
  const { t } = useI18n()

  const assetFileFailReasonOptions = ref<ValueObjectOption<AssetFileFailReason>[]>([
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

  const getAssetFileFailReasonOption = (value: AssetFileFailReason) => {
    return assetFileFailReasonOptions.value.find((item) => item.value === value)
  }

  return {
    assetFileFailReasonOptions,
    getAssetFileFailReasonOption,
  }
}
