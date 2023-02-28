import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export enum DistributionFailReason {
  None = 'none',
  Unknown = 'unknown',
  QuotaReached = 'quota_reached',
  RemoteProcessFailed = 'remote_process_failed',
  Default = None,
}

export function useDistributionFailReason() {
  const { t } = useI18n()

  const DistributionFailReasonOptions = ref<ValueObjectOption<DistributionFailReason>[]>([
    {
      value: DistributionFailReason.None,
      title: t('coreDam.distribution.failReason.none'),
    },
    {
      value: DistributionFailReason.Unknown,
      title: t('coreDam.distribution.failReason.unknown'),
    },
    {
      value: DistributionFailReason.QuotaReached,
      title: t('coreDam.distribution.failReason.quotaReached'),
    },
    {
      value: DistributionFailReason.RemoteProcessFailed,
      title: t('coreDam.distribution.failReason.remoteProcessFailed'),
    },
  ])

  const getDistributionFailReasonOption = (value: DistributionFailReason) => {
    return DistributionFailReasonOptions.value.find((item) => item.value === value)
  }

  return {
    DistributionFailReasonOptions,
    getDistributionFailReasonOption,
  }
}
