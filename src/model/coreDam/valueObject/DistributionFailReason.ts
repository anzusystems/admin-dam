import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import type { ValueObjectOption } from '@anzusystems/common-admin'

export const DistributionFailReason = {
  None: 'none',
  Unknown: 'unknown',
  QuotaReached: 'quota_reached',
  RemoteProcessFailed: 'remote_process_failed',
  ValidationFailed: 'validation_failed',
} as const

export type DistributionFailReasonType = (typeof DistributionFailReason)[keyof typeof DistributionFailReason]
export const DistributionFailReasonDefault = DistributionFailReason.None

export function useDistributionFailReason() {
  const { t } = useI18n()

  const DistributionFailReasonOptions = ref<ValueObjectOption<DistributionFailReasonType>[]>([
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
    {
      value: DistributionFailReason.ValidationFailed,
      title: t('coreDam.distribution.failReason.validationFailed'),
    },
  ])

  const getDistributionFailReasonOption = (value: DistributionFailReasonType) => {
    return DistributionFailReasonOptions.value.find((item) => item.value === value)
  }

  return {
    DistributionFailReasonOptions,
    getDistributionFailReasonOption,
  }
}
